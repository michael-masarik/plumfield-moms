const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(
    session({
        name: "session",
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
    })
);

// Serve static files (CSS, JS, HTML) from "public" directory
app.use("/public", express.static(path.join(__dirname, "public")));

// Redirect /admin to the PWA page
app.get("/", (req, res) => {
    res.redirect("/admin/public/pwa.html");
});

// Load authentication and PWA routes
const pwaRoutes = require("./routes/pwaRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(pwaRoutes);
app.use(authRoutes);

module.exports = app;