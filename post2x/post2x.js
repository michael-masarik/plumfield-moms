import fetch from "node-fetch";
import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
    throw new Error("Notion API key is not set in the environment variables.");
}
const DATABASE_ID = process.env.DATABASE_ID;
if (!DATABASE_ID) {
    throw new Error("Notion database ID is not set in the environment variables.");
}

async function getNotionPosts() {
    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            filter: {
                property: "Status",
                select: {
                    equals: "Publish"
                }
            }
        })
    });

    const data = await response.json();
    return data.results.map(page => ({
        id: page.id,
        content: page.properties.Name.title[0]?.text.content || "No title"
    }));
}

getNotionPosts().then(console.log);