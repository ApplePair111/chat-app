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

document.getElementById("usernamebox").textContent = `Logged in as: ${name}`;


socket.onopen = () => {
    socket.send(JSON.stringify({type: "name", name: name}));
};

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
        text.innerText = `Connection terminated due to ${json.reason}.\nPlease `;
        if (json.reason==="screw you.") {
            text.innerText += "leave this chatroom.";
        } else {
            text.innerText += "reload the page and try again.";
        }
        body.appendChild(header);
        body.appendChild(text);

    }
       if (json.type === "message") {
        createMessage(json.message)
    }
};

const sendButton = document.querySelector("#send button")
const messageArea = document.querySelector("#send textarea")

sendButton.addEventListener("click", () => {
    if (messageArea.value.startsWith("/ban")) {
        socket.send(JSON.stringify({ type: "ban", name: messageArea.value.split(" ")[1] }))
    }
    socket.send(JSON.stringify({type: "message", message: messageArea.value}))
})

