const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    const { sender, receiver } = req.body;

    if (!sender || !receiver) {
        return res.status(400).json({ error: "❌ sender and receiver required" });
    }

    const peoplePath = path.join(__dirname, "..", "..", "people");

    const senderFolder = path.join(peoplePath, sender);
    const receiverFolder = path.join(peoplePath, receiver);

    const senderFile = path.join(senderFolder, `${receiver}.txt`);
    const receiverFile = path.join(receiverFolder, `${sender}.txt`);

    const unreadFile = path.join(receiverFolder, "un-read.txt"); // 🟡 NEW FILE PATH

    try {
        // ✅ Ensure sender and receiver folders exist
        if (!fs.existsSync(senderFolder)) {
            fs.mkdirSync(senderFolder, { recursive: true });
        }

        if (!fs.existsSync(receiverFolder)) {
            fs.mkdirSync(receiverFolder, { recursive: true });
        }

        // ✅ Ensure the chat files exist
        if (!fs.existsSync(senderFile)) {
            fs.writeFileSync(senderFile, "");
        }
        if (!fs.existsSync(receiverFile)) {
            fs.writeFileSync(receiverFile, "");
        }

        // ✅ Create un-read.txt if not present
        if (!fs.existsSync(unreadFile)) {
            fs.writeFileSync(unreadFile, "");
        }

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Chat initiation error:", err);
        res.status(500).json({ error: "Couldn't initiate chat." });
    }
};
