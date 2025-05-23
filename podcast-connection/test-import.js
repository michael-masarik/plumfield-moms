import "dotenv/config";
import axios from "axios";
import { Client } from "@notionhq/client";
import xml2js from "xml2js";
import pgHelper from "pg-helper";
import * as cheerio from "cheerio";

// Notion setup
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const rssFeedUrl = process.env.PODBEAN_FEED_URL;

// Function to fetch RSS feed & parse XML
async function fetchPodcastEpisodes() {
    try {
        const response = await axios.get(rssFeedUrl);
        const parsedData = await xml2js.parseStringPromise(response.data);
        return parsedData.rss.channel[0].item; // Array of episodes
    } catch (error) {
        console.error("Error fetching RSS feed:", error);
        return [];
    }
}

// Function to check if an episode already exists in the database
async function isEpisodeInDatabase(url) {
    const whereClause = { url: url };
    console.log(`🔍 Checking database for existing episode:`, whereClause);
    const result = await pgHelper.selectFromTable("test_episode_table", whereClause);
    return result.length > 0;  
}

function parseShowNotes(html, link) {
    const $ = cheerio.load(html);
    let notionBlocks = [];

    $("p, ul, ol").each((_, elem) => {
        const tag = $(elem).prop("tagName").toLowerCase();
        const richText = [];

        // Process each child node (text and links)
        $(elem).contents().each((_, node) => {
            if (node.type === 'text') {
                // Add text node
                const textContent = node.data.trim();
                if (textContent) {
                    richText.push({
                        type: "text",
                        text: { content: textContent, link: null },
                        annotations: { 
                            bold: false, 
                            italic: false, 
                            strikethrough: false, 
                            underline: false, 
                            code: false, 
                            color: "default" 
                        },
                        plain_text: textContent,
                        href: null // No hyperlink for plain text
                    });
                }
            } else if (node.type === 'tag' && node.name === "a") {
                // Add link node
                const url = $(node).attr("href"); // Extract the href attribute
                const linkText = $(node).text().trim();

                // Log the extracted link
                console.log(`Extracted link: ${url} with text: ${linkText}`);

                if (linkText && url) { // Ensure both linkText and url are present
                    richText.push({
                        type: "text",
                        text: { content: linkText, link: { url } }, // Include the link URL
                        annotations: { 
                            bold: false, 
                            italic: false, 
                            strikethrough: false, 
                            underline: false, 
                            code: false, 
                            color: "default" 
                        },
                        plain_text: linkText,
                        href: url // Set hyperlink for the link text
                    });
                }
            }
        });

        // Log the rich text being added
        if (richText.length > 0) {
            console.log('Rich text being added:', richText);
            notionBlocks.push({
                object: "block",
                type: tag === "li" ? "bulleted_list_item" : "paragraph",
                [tag === "li" ? "bulleted_list_item" : "paragraph"]: {
                    rich_text: richText
                }
            });
        }
    });

    return notionBlocks;
}
// Function to create a Notion page for an episode
async function createNotionPage(episode) {
    const title = episode.title[0];
    const pubDate = new Date(episode.pubDate[0]).toISOString();
    const link = episode.link[0];
    const audioUrl = episode.enclosure ? episode.enclosure[0].$.url : "";
    const showNotes = episode.description ? episode.description[0] : "No show notes available.";
    const imageUrl = episode["itunes:image"] ? episode["itunes:image"][0].$.href : "https://pbcdn1.podbean.com/imglogo/image-logo/14312154/PlumfieldMomsLogo_skhzpw_300x300.jpg";

    // Check if episode already exists in the database
    if (await isEpisodeInDatabase(link)) {
        console.log(`⚠️ Skipping: ${title} (already in database)`);
        return;
    }

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: { title: [{ text: { content: title } }] },
                Date: { date: { start: pubDate } },
            },
            children: [
                {
                    object: "block",
                    type: "image",
                    image: {
                        type: "external",
                        external: {
                            url: imageUrl // The episode’s iTunes image link
                        },
                        caption: [{ type: "text", text: { content: link } }] // Caption for the image
                    }
                },
                {
                    object: "block",
                    type: "embed",
                    embed: { url: audioUrl }
                },
                ...parseShowNotes(showNotes, link) // Insert parsed show notes as Notion blocks
            ]
        });

        console.log(`✅ Added: ${title}`);

        // Insert into PostgreSQL database
        await pgHelper.insertIntoTable("test_episode_table", {
            url: link,
            name: title,
        });

    } catch (error) {
        console.error(`❌ Error adding ${title}:`, error.message);
    }
}

// Batch process episodes to respect Notion API limits
async function batchProcessEpisodes(episodes, batchSize = 3, delayMs = 1000) {
    for (let i = 0; i < episodes.length; i += batchSize) {
        const batch = episodes.slice(i, i + batchSize);
        await Promise.all(batch.map(createNotionPage));
        console.log(`⏳ Waiting ${delayMs}ms to avoid rate limits...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
}

// Main function
(async () => {
    console.log("📡 Fetching podcast episodes...");
    const episodes = await fetchPodcastEpisodes();
    console.log(`🎙 Found ${episodes.length} episodes. Checking for new ones...`);

    // Count old and new episodes
    let oldCount = 0;
    const newEpisodes = [];
    
    for (const episode of episodes) {
        const link = episode.link[0];
        if (await isEpisodeInDatabase(link)) {
            oldCount++;
        } else {
            newEpisodes.push(episode);
        }
    }

    console.log(`📌 Found ${oldCount} old episodes and ${newEpisodes.length} new episodes.`);
    
    if (newEpisodes.length > 0) {
        await batchProcessEpisodes(newEpisodes.slice(-4)); // Import only last 4 new episodes
    } else {
        console.log("✅ No new episodes to import.");
    }

    console.log("✅ Import process complete!");
})();