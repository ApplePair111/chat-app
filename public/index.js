const body = document.body;

const chat = document.querySelector(".chat");

let socket = new WebSocket((location.protocol === "https:" ? "wss://": "ws://") + location.host + "/ws");
const params = new URLSearchParams(location.search);

const urlName = params.get("name");

if (urlName) {
    console.log("URL name!!")
    localStorage.setItem("name", urlName);
    location.replace(location.pathname); // removes ?name=..., no extra reload needed
} else if (!localStorage.getItem("name")) {
    console.log("Need login!")
    location.href = "/login.html";
}


let name = localStorage.getItem("name");

document.getElementById("usernamebox").textContent = `${name}`;

async function createAvatar() {

const imgdiv = document.getElementById("imgdiv");

const res = await fetch(`/api/avatar/${name}`);
const text = await res.text();
const blob = new Blob([text], { type: "image/svg+xml" });

imgdiv.appendChild(document.createElement("img")).src = URL.createObjectURL(blob);

}

createAvatar();

socket.onopen = () => {
    socket.send(JSON.stringify({type: "name", name: name}));
};
/* // OLD VERSION
function createMessage(msgobj) {
    const date = new Date(msgobj.timestamp)

    const div = document.createElement("div");

    div.classList.add("message");

    if (msgobj.name === name) {
        div.classList.add("my");
    } else {
        div.classList.add("other");
    }
    timestamp = document.createElement("span");
    timestamp.classList.add("timestamp");
    timestamp.textContent = msgobj.name + " " + "—" + " " + date.toLocaleTimeString("tr-TR", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, hour: "2-digit", minute: "2-digit" }).replace(":", ".");

    div.appendChild(document.createTextNode(msgobj.message));
    
    div.appendChild(timestamp);
    chat.appendChild(div);
}
*/

function createMessage(msgobj) {
    const date = new Date(msgobj.timestamp);
    const isMine = msgobj.name === name;

    const row = document.createElement("div");
    row.classList.add("message-row", isMine ? "my" : "other");

    const avatar = document.createElement("img");
    avatar.classList.add("avatar");
    avatar.src = "/api/avatar/" + encodeURIComponent(msgobj.name);
    avatar.alt = msgobj.name;
    avatar.title = msgobj.name;
    avatar.loading = "lazy";
    avatar.draggable = false;

    const div = document.createElement("div");
    div.classList.add("message", isMine ? "my" : "other");

    const timestamp = document.createElement("span");
    timestamp.classList.add("timestamp");
    timestamp.textContent =
        msgobj.name + " — " +
        date.toLocaleTimeString("tr-TR", {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hour: "2-digit",
            minute: "2-digit"
        }).replace(":", ".");

    div.appendChild(document.createTextNode(msgobj.message));
    div.appendChild(timestamp);

    if (isMine) {
        row.appendChild(div);
        row.appendChild(avatar);
    } else {
        row.appendChild(avatar);
        row.appendChild(div);
    }

    chat.appendChild(row);
}

socket.onmessage = (data) => {
    console.log(`New msg: ${data.data}`)
    const json = JSON.parse(data.data);
    if (json.type === "init") {
        for (const message of json.messages) {
            createMessage(message)
        }
    }

    if (json.type === "error") {
        body.style.display = "flex";
        body.style.alignItems = "center";
        body.style.justifyContent = "center";
        body.replaceChildren();
        let header = document.createElement("h1");
        header.innerText = "Error"
        let text = document.createElement("p");
        text.style.textAlign = "center";
        if (json.reason==="screw you.") {
            text.innerText = `You got banned.\nPlease leave the chatroom. `;
        } else {
            text.innerText = `Connection terminated due to ${json.reason}.\nPlease reload the page and try again. `;
        }
        body.appendChild(header);
        body.appendChild(text);

    }
       if (json.type === "message") {
        createMessage(json.message)
    }
};

const sendButton = document.querySelector("#sendbtn")
const messageArea = document.querySelector("#send textarea")

function sendMsg(msg) {
    if (msg.startsWith("/ban")) {
        socket.send(JSON.stringify({ type: "ban", name: msg.split(" ")[1] }))
        return;
    }
    socket.send(JSON.stringify({type: "message", message: msg}))
}

sendButton.addEventListener("click", () => {
    sendMsg(messageArea.value)
})

uploadButton.addEventListener("click", () => {})

messageArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMsg(messageArea.value)
  }
});