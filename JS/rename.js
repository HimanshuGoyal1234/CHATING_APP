const fs = require("fs");
const path = require("path");

module.exports = function rename(req, res) {
    const { old, new: newName } = req.body;

    if (!old || !newName) {
        return res.status(400).json({ success: false, message: "❌ Missing old or new username." });
    }

    const loginDataPath = path.join(__dirname, "../", "LOGIN", "id_pass.json");
    const peoplePath = path.join(__dirname, "../", "People");

    fs.readFile(loginDataPath, "utf-8", (err, data) => {
        if (err) {
            console.error("❌ Failed to read id_pass.json:", err);
            return res.status(500).json({ success: false, message: "Server error while checking users." });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            console.error("❌ JSON parse error:", parseErr);
            return res.status(500).json({ success: false, message: "Corrupted user database." });
        }

        const usernameExists = users.some(user => user.username === newName);
        if (usernameExists) {
            return res.status(400).json({ success: false, message: "❌ Username already exists." });
        }

        const oldFolderPath = path.join(peoplePath, old);
        const newFolderPath = path.join(peoplePath, newName);

        // Step 1: Rename the user folder
        fs.rename(oldFolderPath, newFolderPath, (err) => {
            if (err) {
                console.error("❌ Error renaming folder:", err);
                return res.status(500).json({ success: false, message: "Failed to rename folder." });
            }

            // Step 2: Rename old.txt → new.txt inside renamed folder
            const oldTxtPath = path.join(newFolderPath, `${old}.txt`);
            const newTxtPath = path.join(newFolderPath, `${newName}.txt`);
            fs.rename(oldTxtPath, newTxtPath, (err2) => {
                if (err2 && err2.code !== 'ENOENT') {
                    console.error("⚠️ Error renaming self txt file:", err2);
                }

                // Step 3: Rename old.txt → new.txt inside all other user folders
                fs.readdir(peoplePath, (err3, allUsers) => {
                    if (err3) {
                        console.error("❌ Failed to read People directory:", err3);
                        return res.status(500).json({ success: false, message: "Failed to process all folders." });
                    }

                    allUsers.forEach((userFolder) => {
                        const userFolderPath = path.join(peoplePath, userFolder);

                        if (userFolder !== old && userFolder !== newName) {
                            const insideOldTxt = path.join(userFolderPath, `${old}.txt`);
                            const insideNewTxt = path.join(userFolderPath, `${newName}.txt`);

                            fs.rename(insideOldTxt, insideNewTxt, (renameErr) => {
                                if (renameErr && renameErr.code !== 'ENOENT') {
                                    console.error(`⚠️ Failed to rename ${old}.txt in ${userFolder}:`, renameErr);
                                }
                            });
                        }
                    });

                    // Step 4: Update id_pass.json
                    const userIndex = users.findIndex(user => user.username === old);
                    if (userIndex === -1) {
                        return res.status(404).json({ success: false, message: "Old username not found." });
                    }

                    users[userIndex].username = newName;

                    fs.writeFile(loginDataPath, JSON.stringify(users, null, 4), (err4) => {
                        if (err4) {
                            console.error("❌ Error updating id_pass.json:", err4);
                            return res.status(500).json({ success: false, message: "Username changed, but failed to update login data." });
                        }

                        console.log(`✅ Username changed from "${old}" to "${newName}"`);
                        res.json({ success: true });
                    });
                });
            });
        });
    });
};
