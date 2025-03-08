
const express = require("express");
const cors = require("cors");
const { Client } = require("@notionhq/client");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "https://admin.plumfieldmoms.com", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Database IDs from .env file
const DB_IDS = {
    bookReview: process.env.NOTION_BOOK_REVIEW_DB,
    pictureBookReview: process.env.NOTION_PICTURE_BOOK_DB,
    reflection: process.env.NOTION_REFLECTION_DB,
};
const SECRET_PASSWORD = process.env.SECRET_PASSWORD;
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome!</h1>
        <p>This page is goes to nowhere. Please visit 
            <a href='https://admin.plumfieldmoms.com/login'>admin.plumfieldmoms.com/login</a>
        </p>
    `);
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});
// Handle password submission
app.post("/login", (req, res) => {
    const { password } = req.body; // 🔥 Get password from form

    if (password === SECRET_PASSWORD) {
        req.session.authenticated = true; // ✅ Mark user as logged in
        res.redirect("/submit-draft"); // Redirect to the form page
    } else {
        res.send("Invalid password. <a href='/login'>Try again</a>");
    }
});

// Protect the form page
app.get("/submit-draft", (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "draft-form.html"));
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
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});
// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
