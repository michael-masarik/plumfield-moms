
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

// Search for authors in Notion
app.get("/authors", async (req, res) => {
    const { search } = req.query;

    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_AUTHORS_DB,
        });

        let authors = response.results.map((page) => ({
            id: page.id,
            name: page.properties.Name.title[0]?.text.content || "Unknown",
        }));

        // If a search query exists, filter authors
        if (search) {
            const lowerSearch = search.toLowerCase();
            authors = authors.filter(author => 
                author.name.toLowerCase().includes(lowerSearch)
            );
        }

        res.json(authors);
    } catch (error) {
        console.error(error);
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
            children: [
                formattedBlocks
            ]
        });

        res.json({ success: true, message: "Review submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
