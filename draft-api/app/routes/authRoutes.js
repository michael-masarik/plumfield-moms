const express = require("express");
const router = express.Router();

router.get("/api/session-status", (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

module.exports = router;