const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");

const joinForm = document.getElementById("joinForm");
const nameInput = document.getElementById("nameInput");

const meLabel = document.getElementById("meLabel");
const messagesEl = document.getElementById("messages");

const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msgInput");
const leaveBtn = document.getElementById("leaveBtn");

let socket = null;
let myName = "";

function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMessage({ name, text, ts }, isSystem = false) {
    const div = document.createElement("div");
    div.className = "msg" + (isSystem ? " system" : "");

    const meta = document.createElement("div");
    meta.className = "meta";

    const left = document.createElement("span");
    left.textContent = isSystem ? "System" : name;

    const right = document.createElement("span");
    right.textContent = formatTime(ts);

    meta.appendChild(left);
    meta.appendChild(right);

    const body = document.createElement("div");
    body.textContent = text;

    div.appendChild(meta);
    div.appendChild(body);

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function connectAndJoin() {
    socket = io(); // connects to same host that served the page

    socket.on("connect", () => {
        socket.emit("join", { name: myName });
    });

    socket.on("chat:history", (history) => {
        // optional: show last N messages that server kept in memory
        if (Array.isArray(history) && history.length) {
            history.forEach((m) => addMessage(m, false));
            addMessage({ text: "— joined —", ts: Date.now() }, true);
        }
    });

    socket.on("chat:message", (msg) => addMessage(msg, false));

    socket.on("system", (msg) => addMessage(msg, true));

    socket.on("disconnect", () => {
        addMessage({ text: "Disconnected. Refresh to rejoin.", ts: Date.now() }, true);
    });
}

function enterChat() {
    joinScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    meLabel.textContent = `You are: ${myName}`;
    messagesEl.innerHTML = "";
    connectAndJoin();
    msgInput.focus();
}

function leaveChat() {
    if (socket) socket.disconnect();
    socket = null;
    chatScreen.classList.add("hidden");
    joinScreen.classList.remove("hidden");
    nameInput.focus();
}

joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    myName = name.slice(0, 30);
    enterChat();
});

msgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!socket) return;
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("chat:message", { text });
    msgInput.value = "";
});

leaveBtn.addEventListener("click", () => leaveChat());
