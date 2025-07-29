// JS/chat/delete_chat_list.js
const fs = require("fs");
const path = require("path");

module.exports = function delete_chat_list(req, res) {
    const { user, receiver } = req.body;
``
    const listPath = path.join(__dirname, `../People/${user}/chat-list.txt`);

    fs.readFile(listPath, "utf8", (err, data) => {
        if (err) {
            console.error("❌ Error reading chat-list.txt:", err);
            return res.status(500).json({ message: "❌ Failed to read chat list" });
        }

        const updatedLines = data
            .split("\n")
            .filter(line => line.trim() !== "" && line.trim() !== receiver);

        fs.writeFile(listPath, updatedLines.join("\n"), "utf8", (err) => {
            if (err) {
                console.error("❌ Error writing chat-list.txt:", err);
                return res.status(500).json({ message: "❌ Failed to update chat list" });
            }

            console.log(`✅ Removed ${receiver} from ${user}'s chat-list.txt`);
            return res.json({ message: `✅ ${receiver} chat cleared and removed from chat list!` });
        });
    });
}
