const express = require("express");
const path = require("path");

const app = express();

// Redirect /admin to the PWA page
app.get("/", (req, res) => {
    res.redirect("/public/pwa.html");
});

// Load authentication and PWA routes
const pwaRoutes = require("./routes/pwaRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(pwaRoutes);
app.use(authRoutes);

module.exports = app;