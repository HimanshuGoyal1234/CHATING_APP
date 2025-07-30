const fs = require("fs");
const path = require("path");

module.exports = function changePassword(req, res) {
  const { username, password } = req.body;

  const filePath = path.join(__dirname, "../LOGIN/id_pass.json");

  try {
    // Step 1: Read file and parse JSON
    const rawData = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(rawData);

    // Step 2: Find and update the matching user
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex === -1) {
      return res.json({ success: false, message: "User not found" });
    }

    users[userIndex].password = password;

    // Step 3: Save updated data
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");

    res.json({ success: true, message: "Password updated" });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
