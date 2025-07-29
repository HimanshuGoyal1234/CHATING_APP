// JS/search.js
const fs = require("fs");

module.exports = (req, res) => {
    const query = req.body.search_query?.trim().toLowerCase();

    if (!query) return res.json({ results: [] });

    fs.readFile("../LOGIN/id_pass.json", "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ error: "File read error" });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: "JSON parse error" });
        }

        const results = users.filter(user =>
            user.username.toLowerCase().includes(query)
        );

        res.json({ results });
    });
};
