import "dotenv/config";
import { Client } from "@notionhq/client";
import xml2js from "xml2js";
import pgHelper from "pg-helper";
import * as cheerio from "cheerio";
import cron from 'node-cron'; // Import the node-cron package

// Notion setup
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const rssFeedUrl = process.env.PODBEAN_FEED_URL;

// Function to fetch RSS feed & parse XML using Fetch API
async function fetchPodcastEpisodes() {
    try {
        const response = await fetch(rssFeedUrl);
        const textData = await response.text();
        const parsedData = await xml2js.parseStringPromise(textData);
        return parsedData.rss.channel[0].item; // Array of episodes
    } catch (error) {
        console.error("Error fetching RSS feed:", error);
        return [];
    }
}

// Function to check if an episode already exists in the database
async function isEpisodeInDatabase(url) {
    const whereClause = { url: url };
    const result = await pgHelper.selectFromTable("podcast_record", whereClause);
    return result.length > 0;  
}

// Function to parse show notes and create Notion blocks
function parseShowNotes(html) {
    const $ = cheerio.load(html);
    let notionBlocks = [];

    $("p, ul").each((_, elem) => {
        const tag = $(elem).prop("tagName").toLowerCase();

        // Handle paragraphs
        if (tag === "p") {
            const richText = [];
            $(elem).contents().each((_, node) => {
                if (node.type === 'text') {
                    const textContent = node.data.trim();
                    if (textContent) {
                        richText.push({
                            type: "text",
                            text: { content: textContent + " ", link: null }, // Add space
                            annotations: { 
                                bold: false, 
                                italic: false, 
                                strikethrough: false, 
                                underline: false, 
                                code: false, 
                                color: "default" 
                            },
                            plain_text: textContent + " ", // Add space
                            href: null
                        });
                    }
                } else if (node.type === 'tag' && node.name === "a") {
                    const url = $(node).attr("href");
                    const linkText = $(node).text().trim();
                    if (linkText && url) {
                        richText.push({
                            type: "text",
                            text: { content: linkText, link: { url } },
                            annotations: { 
                                bold: false, 
                                italic: false, 
                                strikethrough: false, 
                                underline: false, 
                                code: false, 
                                color: "default" 
                            },
                            plain_text: linkText, // No space here to avoid double spacing
                            href: url
                        });
                        // Add a space after the link
                        richText.push({
                            type: "text",
                            text: { content: " ", link: null }, // Add space after the link
                            annotations: { 
                                bold: false, 
                                italic: false, 
                                strikethrough: false, 
                                underline: false, 
                                code: false, 
                                color: "default" 
                            },
                            plain_text: " ", // Space for formatting
                            href: null
                        });
                    }
                }
            });

            // Create Notion block for the paragraph
            if (richText.length > 0) {
                notionBlocks.push({
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: richText
                    }
                });
            }
        }

        // Handle unordered lists
        if (tag === "ul") {
            $(elem).find("li").each((_, li) => {
                const richText = [];
                $(li).contents().each((_, node) => {
                    if (node.type === 'text') {
                        const textContent = node.data.trim();
                        if (textContent) {
                            richText.push({
                                type: "text",
                                text: { content: textContent + " ", link: null }, // Add space
                                annotations: { 
                                    bold: false, 
                                    italic: false, 
                                    strikethrough: false, 
                                    underline: false, 
                                    code: false, 
                                    color: "default" 
                                },
                                plain_text: textContent + " ", // Add space
                                href: null
                            });
                        }
                    } else if (node.type === 'tag' && node.name === "a") {
                        const url = $(node).attr("href");
                        const linkText = $(node).text().trim();
                        if (linkText && url) {
                            richText.push({
                                type: "text",
                                text: { content: linkText, link: { url } },
                                annotations: { 
                                    bold: false, 
                                    italic: false, 
                                    strikethrough: false, 
                                    underline: false, 
                                    code: false, 
                                    color: "default" 
                                },
                                plain_text: linkText, // No space here to avoid double spacing
                                href: url
                            });
                            // Add a space after the link
                            richText.push({
                                type: "text",
                                text: { content: " ", link: null }, // Add space after the link
                                annotations: { 
                                    bold: false, 
                                    italic: false, 
                                    strikethrough: false, 
                                    underline: false, 
                                    code: false, 
                                    color: "default" 
                                },
                                plain_text: " ", // Space for formatting
                                href: null
                            });
                        }
                    }
                });

                // Create Notion block for the list item
                if (richText.length > 0) {
                    notionBlocks.push({
                        object: "block",
                        type: "bulleted_list_item",
                        bulleted_list_item: {
                            rich_text: richText
                        }
                    });
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
    const firstColonIndex = title.indexOf(":"); // Find the first ':'
    const category = (firstColonIndex !== -1 ? title.substring(0, firstColonIndex).trim() : title).replace(/[,.]/g, "");
    const imageUrl = episode["itunes:image"] ? episode["itunes:image"][0].$.href : "https://pbcdn1.podbean.com/imglogo/image-logo/14312154/PlumfieldMomsLogo_skhzpw_300x300.jpg";

    // Check if episode already exists in the database
    if (await isEpisodeInDatabase(link)) {
        console.log(`⚠️ Skipping: ${title} (already in database)`);
        return;
    }

    try {
        // Parse the show notes using the provided parser code
        const notionBlocks = parseShowNotes(showNotes, link);

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: { title: [{ text: { content: title } }] },
                Date: { date: { start: pubDate } },
                Category:
                    { select: { name: category } }, // Add category as a select property
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
                ...notionBlocks // Insert parsed show notes as Notion blocks
            ]
        });

        console.log(`✅ Added: ${title}`);

        // Insert into PostgreSQL database
        await pgHelper.insertIntoTable("podcast_record", {
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

// Schedule the task to run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    console.log("🕛 Running scheduled task to fetch podcast episodes...");
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
        await batchProcessEpisodes(newEpisodes); // Import all new episodes
    } else {
        console.log("✅ No new episodes to import.");
    }

    console.log("✅ Import process complete!");
});

// Main function to run immediately on start
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
        await batchProcessEpisodes(newEpisodes); // Import all new episodes
    } else {
        console.log("✅ No new episodes to import.");
    }

    console.log("✅ Import process complete!");
})();