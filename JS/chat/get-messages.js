// JS/chat/get-messages.js
const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    const { sender, receiver } = req.query;

    if (!sender || !receiver) {
        return res.status(400).json({ error: "❌ sender and receiver required" });
    }

    const chatFile = path.join(__dirname, "..", "..", "people", sender, `${receiver}.txt`);

    if (!fs.existsSync(chatFile)) {
        return res.json({ messages: [] });
    }

    try {
        const content = fs.readFileSync(chatFile, "utf-8");
        const lines = content.trim().split("\n");

        const messages = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);

        res.json({ messages });
    } catch (err) {
        console.error("❌ Message loading error:", err);
        res.status(500).json({ error: "Failed to load messages." });
    }
};
