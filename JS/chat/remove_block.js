const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    const { receiver, sender } = req.query;

    if (!receiver || !sender) {
        return res.status(400).json({ error: "❌ receiver and sender required" });
    }

    const blockedFilePath = path.join(__dirname, `../../people/${receiver}/blocked.txt`);

    // ✅ Step 1: Check if file exists
    if (!fs.existsSync(blockedFilePath)) {
        return res.json({ message: "❌ blocked.txt file not found", unblocked: false });
    }

    // ✅ Step 2: Read existing lines
    let lines = fs.readFileSync(blockedFilePath, "utf-8")
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0);

    // ✅ Step 3: Check if sender is present
    if (!lines.includes(sender)) {
        return res.json({ message: "ℹ️ sender not found in blocked list", unblocked: false });
    }

    // ✅ Step 4: Remove sender from list
    lines = lines.filter(name => name !== sender);

    // ✅ Step 5: Rewrite file
    fs.writeFileSync(blockedFilePath, lines.join('\n') + '\n');

    res.json({ message: `✅ ${sender} unblocked for ${receiver}`, unblocked: true });
};
