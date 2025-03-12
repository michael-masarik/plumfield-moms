const express = require("express");
const router = express.Router();
const path = require("path");

app.get("/pwa", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "../public/pwa.html"));
});

module.exports = router;