const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

const loginHandler = require('./JS/login');
const createAccountHandler = require('./JS/create_account');
const startChatHandler = require('./JS/chat/chat-initiate');
const chatMessages = require('./JS/chat/chat-messages');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const activeStatus = require('./JS/active_user'); // ya './JS/activeStatus'
const deleteChatList = require('./JS/chat/delete_chat_list');
const checkBlock = require('./JS/chat/block');
app.get('/is-blocked', checkBlock);
const re_Block = require('./JS/chat/remove_block');
app.get('/re-blocked', re_Block);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/LOGIN', express.static(path.join(__dirname, 'LOGIN')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/unread', (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).send("username required");

    const filePath = path.join(__dirname, "people", username, "un-read.txt");
    // ✅ Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.send(""); // Return empty if file not found
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    res.send(rawData);
});

app.post("/add_unread", (req, res) => {
    const { username, receiver } = req.body;

    const dirPath = path.join(__dirname, `people/${ receiver }`);
    const filePath = path.join(dirPath, "un-read.txt");
    const blockedPath = path.join(dirPath, "blocked.txt");

    // ✅ Check if receiver has blocked this username
    if (fs.existsSync(blockedPath)) {
        const blockedList = fs.readFileSync(blockedPath, "utf-8")
            .split("\n")
            .map(line => line.trim());

        if (blockedList.includes(username)) {
            console.log(`❌ ${ receiver } has blocked ${ username }. Not adding to un-read.txt`);
            return res.json({ success: false, message: "User is blocked." });
        }
    }

    // ✅ Ensure folder exists
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // ✅ Create file if not exists
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "");
    }

    // ✅ Read current usernames in file
    let existing = fs.readFileSync(filePath, "utf-8")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

    // ✅ If username not already in list, add it
    if (!existing.includes(username)) {
        existing.unshift(username);
        fs.writeFileSync(filePath, existing.join("\n"));
        console.log(`✅ Added ${ username } to ${ receiver }/un-read.txt`);
    }

    res.json({ success: true, unread: existing });
});

app.post("/clear_chat", (req, res) => {
    const { user, receiver } = req.body;
    // 1️⃣ Clear the chat file
    const chatFilePath = path.join(__dirname, "People", user, `${ receiver }.txt`);
    try {
        fs.writeFileSync(chatFilePath, "", "utf-8");
        console.log(`✅ Emptied file: ${ chatFilePath }`);
    } catch (err) {
        console.error("❌ Error clearing file:", err);
        return res.status(500).json({ message: "❌ Failed to clear chat file" });
    }
    // 2️⃣ Now update chat-list.txt
    const listPath = path.join(__dirname, "People", user, "chat-list.txt");

    fs.readFile(listPath, "utf8", (err, data) => {
        if (err) {
            console.error("❌ Error reading chat-list.txt:", err);
            return res.status(500).json({ message: "❌ Failed to read chat list" });
        }

        const updatedLines = data
            .split("\n")
            .filter(line => line.trim() !== "" && line.trim() !== receiver);

        fs.writeFile(listPath, updatedLines.join("\n"), "utf8", (err) => {
            if (err) {
                console.error("❌ Error writing chat-list.txt:", err);
                return res.status(500).json({ message: "❌ Failed to update chat list" });
            }

            console.log(`✅ Removed ${ receiver } from ${ user }'s chat-list.txt`);

            // ✅ Only one response here
            return res.json({ message: `✅ ${ receiver } chat cleared and removed from chat list!` });
        });
    });
});

// ✅ Routes
app.post('/login', loginHandler);
app.post('/create-account', createAccountHandler);
app.post('/chat', startChatHandler);
app.get('/chat-messages', chatMessages);
app.post("/delete_chat_list", deleteChatList);

// ✅ Search user API
app.post('/search', (req, res) => {
    const query = req.body.search_query?.trim().toLowerCase();
    if (!query) return res.json({ results: [] });

    fs.readFile("LOGIN/id_pass.json", "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "File read error" });
        const users = JSON.parse(data);
        const results = users.filter(user =>
            user.username.toLowerCase().includes(query)
        );
        res.json({ results });
    });
});


// ✅ Active users API
app.get('/active-users', (req, res) => {
    const active = activeStatus.getActiveUsers();
    res.json({ active });
});

app.get('/chat-list/:username', (req, res) => {
    const username = req.params.username;
    const filePath = path.join(__dirname, 'people', username, 'chat-list.txt');

    if (!fs.existsSync(filePath)) {
        return res.json([]);
    }

    const lines = fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');

    res.json(lines);
});

// 🔁 Real-time socket
io.on("connection", (socket) => {
    console.log("📲 User connected");
    socket.on("joinRoom", ({ sender, receiver }) => {
        const room = [sender, receiver].sort().join("_");

        // ✅ Step 1: Check if receiver has blocked sender
        const blockedFilePath = path.join(__dirname, `People/${ receiver }/blocked.txt`);

        if (fs.existsSync(blockedFilePath)) {
            const data = fs.readFileSync(blockedFilePath, "utf8");
            const blockedList = data.split("\n").map(name => name.trim());

            if (blockedList.includes(sender)) {
                // ❌ Blocked, notify sender only
                socket.emit("blockedMessage", {
                    reason: `❌ You are blocked by ${ receiver }. Chat room not joined.`
                });
                return; // Don't proceed to join room
            }
        }

        // ✅ Step 2: Proceed to join room
        socket.join(room);
        console.log(`🟢 ${ sender } joined room: ${ room }`);

        // ✅ Step 3: Remove receiver from sender's unread file
        const unreadPath = path.join(__dirname, `People/${ sender }/un-read.txt`);

        if (fs.existsSync(unreadPath)) {
            fs.readFile(unreadPath, "utf8", (err, data) => {
                if (err) {
                    console.error("❌ Error reading un-read.txt:", err);
                    return;
                }

                const updatedLines = data
                    .split("\n")
                    .filter(line => line.trim() !== receiver);

                fs.writeFile(unreadPath, updatedLines.join("\n"), "utf8", (err) => {
                    if (err) {
                        console.error("❌ Error writing un-read.txt:", err);
                        return;
                    }

                    console.log(`✅ Removed ${ receiver } from ${ sender }'s un-read.txt`);
                });
            });
        }

        // ✅ Set user as active
        socket.username = sender;
        activeStatus.setActive(sender);
    });

    socket.on("sendMessage", ({ sender, receiver, message, timestamp }) => {
        const peopleDir = path.join(__dirname, "people");

        // ✅ Check if receiver has blocked the sender
        const blockedPath = path.join(peopleDir, receiver, "blocked.txt");
        if (fs.existsSync(blockedPath)) {
            const blockedList = fs.readFileSync(blockedPath, "utf8")
                .split("\n")
                .map(name => name.trim())
                .filter(name => name !== "");

            if (blockedList.includes(sender)) {
                console.log(`❌ ${ receiver } has blocked ${ sender }. Message not sent.`);

                // Emit message to the sender only (not to room)
                socket.emit("blockedMessage", {
                    sender,
                    receiver,
                    message,
                    reason: `${ receiver } has blocked you. Message not sent.`
                });

                return;
            }
        }

        // ✅ Save the message in both users' files
        const msgObj = { sender, receiver, message, timestamp };
        const senderFile = path.join(peopleDir, sender, `${ receiver }.txt`);
        const receiverFile = path.join(peopleDir, receiver, `${ sender }.txt`);
        const jsonLine = JSON.stringify(msgObj) + "\n";

        fs.appendFileSync(senderFile, jsonLine);
        fs.appendFileSync(receiverFile, jsonLine);

        // ✅ Emit to socket room
        const room = [sender, receiver].sort().join("_");
        io.to(room).emit("receiveMessage", msgObj);

        // ✅ Remove receiver from sender's un-read.txt (if present)
        const senderUnreadPath = path.join(peopleDir, sender, "un-read.txt");
        console.log(senderUnreadPath)
        if (fs.existsSync(senderUnreadPath)) {
            const data = fs.readFileSync(senderUnreadPath, "utf8")
                .split("\n")
                .map(line => line.trim())
                .filter(line => line && line !== receiver);
            fs.writeFileSync(senderUnreadPath, data.join("\n"));
            console.log(`✅ Removed ${ receiver } from ${ sender }'s un-read.txt`);
        }

        // ✅ Add sender to receiver's un-read.txt (if not already there)
        const receiverUnreadPath = path.join(peopleDir, receiver, "un-read.txt");
        let shouldAddUnread = true;

        if (fs.existsSync(receiverUnreadPath)) {
            const existing = fs.readFileSync(receiverUnreadPath, "utf8")
                .split("\n")
                .map(line => line.trim());
            if (existing.includes(sender)) {
                shouldAddUnread = false;
            }
        }

        if (shouldAddUnread) {
            fs.appendFileSync(receiverUnreadPath, sender + "\n");
            console.log(`📩 Added ${ sender } to ${ receiver }'s un-read.txt`);
        }

        // ✅ Ensure folders exist
        const ensureFolder = (folder) => {
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        };

        ensureFolder(path.join(peopleDir, sender));
        ensureFolder(path.join(peopleDir, receiver));

        // ✅ Update chat lists
        const senderChatList = path.join(peopleDir, sender, "chat-list.txt");
        const receiverChatList = path.join(peopleDir, receiver, "chat-list.txt");
        updateChatList(senderChatList, receiver);
        updateChatList(receiverChatList, sender);

        function updateChatList(filePath, username) {
            let chatUsers = [];

            if (fs.existsSync(filePath)) {
                chatUsers = fs.readFileSync(filePath, "utf8")
                    .split("\n")
                    .map(l => l.trim())
                    .filter(l => l.length > 0 && l !== username);
            }

            chatUsers.unshift(username);
            fs.writeFileSync(filePath, chatUsers.join("\n"));
        }
    });

    socket.on('getOnlineUsers', () => {
        // ✅ Correct
        const onlineUsers = activeStatus.getActiveUsers();
        socket.emit('onlineUsers', onlineUsers); // send back only to requesting user
        console.log(onlineUsers)
    });
    socket.on('typing', ({ sender, receiver, isTyping }) => {
        const room = [sender, receiver].sort().join("_");
        socket.to(room).emit('typing', {
            sender,
            isTyping
        });

        setTimeout(() => {
            console.log(`${ sender } is ${ isTyping ? 'typing' : 'not typing' } to ${ receiver }`);
        }, 1000);
    })
    socket.on("disconnect", () => {
        console.log("❌ User disconnected");
        if (socket.username) {
            activeStatus.setInactive(socket.username);
            // Notify all rooms this user was in about disconnection
            socket.rooms.forEach(room => {
                if (room !== socket.id) { // Skip default room
                    socket.to(room).emit('userDisconnected', { username: socket.username });
                }
            });
        }
    });
});
server.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000");
});
