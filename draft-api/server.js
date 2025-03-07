
const express = require("express");
const cors = require("cors");
const { Client } = require("@notionhq/client");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Database IDs from .env file
const DB_IDS = {
    bookReview: process.env.NOTION_BOOK_REVIEW_DB,
    pictureBookReview: process.env.NOTION_PICTURE_BOOK_DB,
    reflection: process.env.NOTION_REFLECTION_DB,
};
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome!</h1>
        <p>This page is goes to nowhere. Please visit 
            <a href='https://plumfieldmoms.com/admin'>plumfieldmoms.com/admin.</a>
        </p>
    `);
});
// Search for authors in Notion
app.get("/authors", async (req, res) => {
    console.log("Received request for /authors"); // Debug log

    try {
        console.log("Querying Notion database:", process.env.NOTION_AUTHORS_DB);

        const response = await notion.databases.query({
            database_id: process.env.NOTION_AUTHORS_DB,
        });

        console.log("Received response from Notion:", response.results.length, "authors found");

        const authors = response.results.map((page) => ({
            id: page.id,
            name: page.properties.Name.title[0]?.text.content || "Unknown",
        }));

        console.log("Final author list:", authors.length, "authors returned");
        res.json(authors);
    } catch (error) {
        console.error("Error fetching authors:", error);
        res.status(500).json({ error: "Failed to fetch authors" });
    }
});

// Handle Review Submission
app.post("/submit/:type", async (req, res) => {
    const { type } = req.params;
    const { title, formattedBlocks, authorId } = req.body;
    console.log("Received reviewType:", req.body.reviewType);
    console.log(process.env.NOTION_BOOK_REVIEW_DB);

    if (!DB_IDS[type]) {
        return res.status(400).json({ error: "Invalid review type" });
    }

    try {
        await notion.pages.create({
            parent: { database_id: DB_IDS[type] },
            properties: {
                Name: { title: [{ text: { content: title } }] },
                Author: { relation: [{ id: authorId }] },
            },
            children: formattedBlocks // ✅ Fix: Send as array directly
        });

        res.json({ success: true, message: "Review submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
