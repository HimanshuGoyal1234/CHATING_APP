const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const { sender, receiver, offset = 0, limit = 20 } = req.query;

    if (!sender || !receiver) {
        return res.status(400).json({ error: "Sender and receiver required." });
    }

    const filePath = path.join(__dirname, '..', '..', 'people', sender, `${receiver}.txt`);

    if (!fs.existsSync(filePath)) {
        return res.json({ messages: [], hasMore: false });
    }

    const lines = fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(Boolean);

    const total = lines.length;
    const start = Math.max(total - Number(offset) - Number(limit), 0);
    const end = total - Number(offset);

    const selected = lines.slice(start, end).map(line => {
        try {
            return JSON.parse(line);
        } catch (err) {
            return null;
        }
    }).filter(Boolean); // filter invalid JSON lines

    const hasMore = start > 0;

    res.json({ messages: selected, hasMore });
};
