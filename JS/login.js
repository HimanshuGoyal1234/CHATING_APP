// module.exports = (req, res) => {

// };


function updateLastSeen(username) {
    const lastSeenPath = path.join(__dirname, '../LOGIN/last_seen.json');
    let lastSeenData = {};

    // 🔁 Try reading existing file
    try {
        if (fs.existsSync(lastSeenPath)) {
            const data = fs.readFileSync(lastSeenPath, 'utf-8');
            lastSeenData = JSON.parse(data);
        }
    } catch (err) {
        console.error("❌ Error reading last_seen.json:", err);
        lastSeenData = {};
    }

    // ⏰ ✅ Save in ISO format
    lastSeenData[username] = new Date().toISOString();

    // 💾 Write back to file
    try {
        fs.writeFileSync(lastSeenPath, JSON.stringify(lastSeenData, null, 2), 'utf-8');
        console.log("✅ Last seen updated for:", username);
    } catch (err) {
        console.error("❌ Error writing last_seen.json:", err);
    }
}

const fs = require('fs');
const path = require('path');

// ✅ Exported login handler function
module.exports = (req, res) => {
    const { username, password } = req.body;

    // 🔁 Read the data.json file
    const filePath = path.join(__dirname, '../LOGIN/id_pass.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const users = JSON.parse(rawData);

    const userFound = users.find(user => user.username === username && user.password === password);
    if (userFound) {
        console.log("✅ Login successful for:", username);
        updateLastSeen(username)
        res.status(200).json({ redirect: "index.html", user_id: userFound.user_id });

    } else {
        console.log("❌ Login failed for:", username);
        res.send("Login Failed");
    }
};
