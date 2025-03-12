const express = require("express");
const cors = require("cors");
const { Client } = require("@notionhq/client");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS for security
app.use(cors({ origin: "https://admin.plumfieldmoms.com", credentials: true }));

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    name: "session",
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: false } // Set secure:false for local testing
}));

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Notion Database IDs
const DB_IDS = {
    bookReview: process.env.NOTION_BOOK_REVIEW_DB,
    pictureBookReview: process.env.NOTION_PICTURE_BOOK_DB,
    reflection: process.env.NOTION_REFLECTION_DB,
};
const SECRET_PASSWORD = process.env.SECRET_PASSWORD;

// Middleware: Protect routes (excludes login & session check)
app.use((req, res, next) => {
    if (!req.session.authenticated && 
        !["/login", "/api/session-status", "/assets/favicon.ico", "/app/manifest.json"].includes(req.path)) {
        
        if (!req.session.returnTo) { // Only store if not already set
            req.session.returnTo = req.originalUrl;
        }
        return res.redirect("/login");
    }
    next();
});

// Login Page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

// Handle Login
app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === SECRET_PASSWORD) {
        req.session.authenticated = true;
        req.session.user = { id: 123, username: "admin" }; // Store user data

        // Redirect to original page (if exists) or fallback
        const redirectTo = req.session.returnTo || "/";
        delete req.session.returnTo;
        return res.redirect(redirectTo);
    }

    res.status(401).send("Invalid password. <a href='/login'>Try again</a>");
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Session Status API
app.get("/api/session-status", (req, res) => {
    res.json({ isAuthenticated: !!req.session.authenticated });
});

// Serve Admin App (PWA)
app.get("/admin-app", (req, res) => {
    res.sendFile(path.join(__dirname, "app", "public", "pwa.html"));
});

// PWA Redirect (Authenticated Users Only)
app.get("/pwa", (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect("/login");
    }
    res.redirect("/admin-app");
});

// Serve Static Files
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/form-handler.js", (req, res) => res.sendFile(path.join(__dirname, "form-handler.js")));
app.get("/assets/favicon.ico", (req, res) => res.sendFile(path.join(__dirname, "assets", "favicon.ico")));
app.get("/app/manifest.json", (req, res) => res.sendFile(path.join(__dirname, "app", "public", "manifest.json")));
app.use("/icons", express.static(path.join(__dirname, "app", "public", "icons")));

// Protect Draft Submission Page
app.get("/submit-draft", (req, res) => res.sendFile(path.join(__dirname, "draft-form.html")));

// Fetch Authors from Notion
app.get("/authors", async (req, res) => {
    console.log("Fetching authors from Notion...");
    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_AUTHORS_DB,
        });

        const authors = response.results.map((page) => ({
            id: page.id,
            name: page.properties.Name.title[0]?.text.content || "Unknown",
        }));

        res.json(authors);
    } catch (error) {
        console.error("Error fetching authors:", error);
        res.status(500).json({ error: "Failed to fetch authors" });
    }
});

// Handle Review Submission to Notion
app.post("/submit/:type", async (req, res) => {
    const { type } = req.params;
    const { title, formattedBlocks, authorId, iconURL, coverImage } = req.body;

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
            children: formattedBlocks,
            cover: coverImage ? { type: "external", external: { url: coverImage } } : undefined,
            icon: iconURL ? { type: "external", external: { url: iconURL } } : undefined,
        });

        res.json({ success: true, message: "Review submitted successfully" });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));