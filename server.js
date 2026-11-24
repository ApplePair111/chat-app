const express = require("express");
const app = express();
const path = require("path");
const ROOT = path.join(__dirname, "public");
const {  WebSocketServer, WebSocket  } = require("ws");



app.get("/", (req, res) => {
    if (!req.query.name) res.sendFile(path.join(ROOT, "login.html"));
    else res.sendFile(path.join(ROOT, "index.html"));
});


app.use(express.static("public"))

let server = app.listen(3001)
console.log("Server listening on port 3001")
websocketserver = new WebSocketServer({  server,path:"/ws"  });
messages = [];
clients = {};
function broadcast(data) {
    for (const client of Object.values(clients)) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}
websocketserver.on("connection", ws => {
    ws.on("message", (data) => {
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