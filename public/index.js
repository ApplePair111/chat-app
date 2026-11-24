const body = document.body;

const chat = document.querySelector(".chat");

let socket = new WebSocket((location.protocol === "https:" ? "wss://": "ws://") + location.host + "/ws");
const params = new URLSearchParams(location.search);

socket.onopen = () => {
    socket.send(JSON.stringify({type: "name", name: params.get("name")}));
};

socket.onmessage = (data) => {
    const json = JSON.parse(data.data);
    let small;
    if (json.type === "init") {
        for (const message of json.messages) {
            const div = document.createElement("div");
            div.classList.add("message");
            if (message.name === params.get("name")) {
                div.classList.add("my");
            } else {
                div.classList.add("other");
                small = document.createElement("small");
                small.classList.add("other");
                small.textContent = "Sent by "+message.name;
            }
            div.appendChild(document.createTextNode(message.message));
            chat.appendChild(div);
            if (typeof small !== "undefined") chat.appendChild(small);
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
        console.log(`New msg: ${data}`)
        const div = document.createElement("div");
        div.classList.add("message");
        if (json.message.name === params.get("name")) {
            div.classList.add("my");
        } else {
            div.classList.add("other");
        }
        div.appendChild(document.createTextNode(json.message.message));
        chat.appendChild(div);
    }
};

const sendButton = document.querySelector("#send button")
const messageArea = document.querySelector("#send textarea")

sendButton.addEventListener("click", () => {
    socket.send(JSON.stringify({type: "message", message: messageArea.value}))
})