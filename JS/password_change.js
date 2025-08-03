const fs = require("fs");
const path = require("path");

module.exports = function changePassword(req, res) {
  const { username, old_password, new_password } = req.body;

  if (!username || !old_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Username, old password and new password are required"
    });
  }

  if (old_password === new_password) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from old password"
    });
  }

  const filePath = path.join(__dirname, "../LOGIN/id_pass.json");

  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(rawData);

    const userIndex = users.findIndex(user => user.username === username);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[userIndex];

    if (user.password !== old_password) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // Update to new password
    users[userIndex].password = new_password;

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");

    return res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
