const express = require("express");
const app = express();
const path = require("path");
const ROOT = path.join(__dirname, "public");
const {  WebSocketServer, WebSocket  } = require("ws");
const jdenticon = require("jdenticon");
const fs = require("fs");
const multer = require("multer");

app.use(express.static("public"))

let server = app.listen(3001)
console.log("Server listening on port 3001")

const FILE_CAP_MB = 100;
files = {}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_CAP_MB * 1024 * 1024 }
});

function generateFileId(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateAvatar(name) {
    avatars[name] = jdenticon.toSvg(name, 100);
}

app.get("/api/avatar/:name", (req, res) => {
    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=86400");

    const name = req.params.name
    if (name && avatars.name) {
        res.send(avatars[name])
    } else if (name) {
        generateAvatar(name);
        res.send(avatars[name])
    } else {
        res.status(400).json({ error: "no name specified" });
    }
})




websocketserver = new WebSocketServer({ server, path: "/ws" });

messages = [];
clients = {};
avatars = {};
banned = [];

function broadcast(data) {
    for (const client of Object.values(clients)) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}

app.post("/api/uploadFiles", upload.array("files", 10), (req, res) => {
    ids = {}
    req.files.forEach(f => {
        const id = generateFileId(32)
        files[id] = f
        ids[f.originalName] = id 
    })
    res.status(200).json({ id: id })
})

websocketserver.on("connection", ws => {


    ws.on("message", (data) => {
        console.log(`DEBUG: Got message with data: ${data.toString()}`)
        const json = JSON.parse(data.toString());
            if (banned.includes(json.name)) {
                ws.send(JSON.stringify({ type: "error", reason: "screw you." }))
                if (clients[json.name]) {
                    clients[json.name].terminate()
                }
                return;
            }
        if (json.type === "name") {
            ws.name = json.name;
            clients[ws.name] = ws;
            ws.send(JSON.stringify({type: "init", messages: messages}));
        }
        if (json.type === "ban") {
            if (!clients[json.name]) return;
            else {
                clients[json.name].send(JSON.stringify({type: "error", reason: "screw you."}))
                banned.push( json.name )
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
        if (json.type === "fileMessage") {
            if (!ws.name) {
                ws.send(JSON.stringify({type: "error", reason: "unsent name."}));
                ws.terminate();
                return;
            }
            
        }
    });
    ws.on("close", () => {
        if (ws === clients[ws.name]) {
            delete clients[ws.name];
        }
    });
});