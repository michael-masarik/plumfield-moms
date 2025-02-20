import "dotenv/config";
import axios from "axios";
import { Client } from "@notionhq/client";
import xml2js from "xml2js";

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

// Function to create a Notion page for an episode
async function createNotionPage(episode) {
    const title = episode.title[0];
    const pubDate = new Date(episode.pubDate[0]).toISOString();

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: { title: [{ text: { content: title } }] },
                Date: { date: { start: pubDate } },
            },
        });
        console.log(`✅ Added: ${title}`);
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
    console.log(`🎙 Found ${episodes.length} episodes. Importing the last 4 episodes to Notion...`);
    await batchProcessEpisodes(episodes.slice(-4)); // Import last 4 episodes
    console.log("✅ All episodes imported!");
})();