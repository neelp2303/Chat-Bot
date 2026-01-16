const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(express.static(path.join(__dirname, "public")));

const MESSAGE_BUFFER_LIMIT = 0;
const messageBuffer = [];

function addToBuffer(msg) {
    if (MESSAGE_BUFFER_LIMIT <= 0) return;
    messageBuffer.push(msg);
    while (messageBuffer.length > MESSAGE_BUFFER_LIMIT) messageBuffer.shift();
}

io.on("connection", (socket) => {
    socket.on("join", ({ name }) => {
        const safeName =
            typeof name === "string" && name.trim().length > 0
                ? name.trim().slice(0, 30)
                : "Anonymous";

        socket.data.name = safeName;

        socket.emit("chat:history", messageBuffer);

        socket.broadcast.emit("system", {
            text: `${safeName} joined the chat`,
            ts: Date.now(),
        });

        socket.emit("system", {
            text: `Welcome, ${safeName}!`,
            ts: Date.now(),
        });
    });

    socket.on("chat:message", ({ text }) => {
        const name = socket.data.name || "Anonymous";
        const safeText =
            typeof text === "string" ? text.trim().slice(0, 500) : "";

        if (!safeText) return;

        const msg = { name, text: safeText, ts: Date.now() };
        addToBuffer(msg);

        io.emit("chat:message", msg);
    });

    socket.on("disconnect", () => {
        const name = socket.data.name;
        if (!name) return;

        socket.broadcast.emit("system", {
            text: `${name} left the chat`,
            ts: Date.now(),
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
