const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    const { receiver, sender } = req.query;

    if (!receiver || !sender) {
        return res.status(400).json({ error: "❌ receiver and sender required" });
    }

    const receiverFolder = path.join(__dirname, `../../people/${receiver}`);
    const blockedFilePath = path.join(receiverFolder, 'blocked.txt');

    // Step 1: Create receiver folder if not exists
    if (!fs.existsSync(receiverFolder)) {
        fs.mkdirSync(receiverFolder, { recursive: true });
    }

    // Step 2: If file doesn't exist, create it and write receiver name
    if (!fs.existsSync(blockedFilePath)) {
        fs.writeFileSync(blockedFilePath, receiver + '\n');
    }

    // Step 3: Read current content
    let data = fs.readFileSync(blockedFilePath, "utf-8").split('\n').filter(Boolean);

    // Step 4: Add sender if not already in file
    if (!data.includes(sender)) {
        fs.appendFileSync(blockedFilePath, sender + '\n');
    }

    // Step 5: Check if sender is blocked
    const isBlocked = data.includes(sender);
    res.json({ blocked: isBlocked });
};
