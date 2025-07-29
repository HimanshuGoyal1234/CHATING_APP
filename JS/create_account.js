const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'LOGIN/id_pass.json');
const PEOPLE_DIR = path.join(__dirname, '..', 'people');

// ❌ Characters not allowed in usernames (like folder names)
const INVALID_CHARS = /[\/\\:\*\?"<>\|\s]/;  // ⬅️ added \s for space

module.exports = (req, res) => {
    const { username, password } = req.body;

    // ❌ Check for basic length
    if (!username || !password || username.length < 8 || password.length < 8) {
        return res.status(400).json({ error: "❌ Username and password must be at least 8 characters." });
    }
    if (username.length > 15){
        return res.status(400).json({ error: "❌ Username must be lesser then 15 characters." });
        
    }

    // ❌ Check for invalid characters including spaces
    if (INVALID_CHARS.test(username)) {
        return res.status(400).json({ error: "⚠️ Username contains invalid characters or spaces." });
    }

    let users = [];

    if (fs.existsSync(DB_FILE)) {
        users = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }

    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(409).json({ error: "⚠️ Username already exists. Try another one." });
    }

    // ✅ Save user
    users.push({ username, password });
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));

    // ✅ Create user's folder
    const userFolder = path.join(PEOPLE_DIR, username);
    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
    }

    return res.status(200).json({ redirect: "/login.html" });
};
