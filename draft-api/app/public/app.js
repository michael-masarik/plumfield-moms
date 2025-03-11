const express = require("express");
const path = require("path");

const app = express();
app.get("/admin-app", (req, res) => {
    res.redirect("/admin-app/pwa.html");
});
// Load authentication and PWA routes
const pwaRoutes = require("./routes/pwaRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(pwaRoutes);
app.use(authRoutes);

module.exports = app;