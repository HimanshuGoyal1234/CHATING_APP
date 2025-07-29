const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    const username = req.params.username;
    const filePath = path.join(__dirname, "..", "..", "people", username, "chat-list.txt");

    if (!fs.existsSync(filePath)) {
        return res.json([]); // file not found = no chats
    }

    const lines = fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');

    res.json(lines);
};
