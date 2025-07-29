// JS/activeStatus.js

const fs = require('fs');
const path = require('path');

const ACTIVE_FILE = path.join(__dirname, '../LOGIN/active_users.json');
const activeUsers = new Set();

// 🕒 Get timestamp (optional helper)
function getTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-GB', { hour12: false });
}

// 🔁 Load from file
function loadActiveUsersFromFile() {
    try {
        const data = fs.readFileSync(ACTIVE_FILE, 'utf-8');
        const users = JSON.parse(data);
        users.forEach(username => activeUsers.add(username));
    } catch (e) {
        console.log("⚠️ Could not load active users:", e.message);
    }
}

// 💾 Save to file
function saveActiveUsersToFile() {
    fs.writeFileSync(ACTIVE_FILE, JSON.stringify([...activeUsers], null, 2), 'utf-8');
}

// ✅ Add active user
function setActive(username) {
    activeUsers.add(username);
    saveActiveUsersToFile();
}

// ❌ Remove inactive user
function setInactive(username) {
    activeUsers.delete(username);
    saveActiveUsersToFile();
}

// 📃 Get all active usernames
function getActiveUsers() {
    return [...activeUsers];
}

// 📃 Alias
function getAllActive() {
    return [...activeUsers];
}

// ✅ Express route handler to check a user’s online status
function handleCheckActive(req, res) {
    const { username } = req.body;
    const users = getActiveUsers();
    const isOnline = users.includes(username);

    res.json({
        status: isOnline ? 'online' : 'offline',
        lastSeen: isOnline ? getTimestamp() : null
    });
}

// 🔁 Load once on server start
loadActiveUsersFromFile();

// ✅ Export all
module.exports = {
    setActive,
    setInactive,
    getActiveUsers,
    getAllActive,
    handleCheckActive
};
