const express = require("express");
const app = express();
const path = require("path");
const ROOT = path.join(__dirname, "public");
const {  WebSocketServer, WebSocket  } = require("ws");
const jdenticon = require("jdenticon");
const fs = require("fs");

app.use(express.static("public"))

let server = app.listen(3001)
console.log("Server listening on port 3001")


function generateAvatar(name) {
    avatars.name = jdenticon.toSvg(name, 200);
}

app.get("/api/avatar/:name", (req, res) => {
    const name = req.params.name
    if (name && avatars.name) {
        res.json({ avatar: avatars.name });
    } else if (name) {
        avatars.name = generateAvatar(name);
        res.json({ avatar: avatars.name });
    } else {
        res.status(400).json({ error: "no name specified" });
    }
})

websocketserver = new WebSocketServer({ server, path: "/ws" });

messages = [];
clients = {};
avatars = {};

function broadcast(data) {
    for (const client of Object.values(clients)) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}
websocketserver.on("connection", ws => {
    ws.on("message", (data) => {
        console.log(`DEBUG: Got message with data: ${data.toString()}`)
        const json = JSON.parse(data.toString());
        if (json.type === "name") {
            ws.name = json.name;
            clients[ws.name] = ws;
            ws.send(JSON.stringify({type: "init", messages: messages}));
        }
        if (json.type === "ban") {
            if (!clients[json.name]) return;
            else {
                clients[json.name].send(JSON.stringify({type: "error", reason: "screw you."}))
                clients[json.name].terminate();
            }
            delete clients[json.name];
        }
        if (json.type === "message") {
            if (!ws.name) {
                ws.send(JSON.stringify({type: "error", reason: "unsent name."}));
                ws.terminate();
                return;
            }
            const message = {message: json.message, timestamp: Date.now(), name: ws.name};
            messages.push(message);
            broadcast({type: "message", message: message});
        }
    });
    ws.on("close", () => {
        if (ws === clients[ws.name]) {
            delete clients[ws.name];
        }
    });
});