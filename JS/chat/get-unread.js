// ✅ Now update unread.txt for receiver
const unreadFile = path.join(__dirname, `../People/${receiver}/un-read.txt`);
let shouldAddUnread = true;

// 🔁 Read receiver's unread.txt to avoid duplicates
if (fs.existsSync(unreadFile)) {
    const existing = fs.readFileSync(unreadFile, "utf8").split("\n").map(l => l.trim());
    if (existing.includes(sender)) {
        shouldAddUnread = false;
    }
}

// ✅ Check again that receiver hasn't blocked sender
const blockedPath = path.join(__dirname, `../People/${receiver}/blocked.txt`);
let blockedList = [];

if (fs.existsSync(blockedPath)) {
    blockedList = fs.readFileSync(blockedPath, "utf8")
        .split("\n").map(l => l.trim()).filter(Boolean);
}

if (!blockedList.includes(sender) && shouldAddUnread) {
    fs.appendFileSync(unreadFile, sender + "\n");
}
