const socket = io();

const messageInput = document.getElementById("message-input");
const contactsList = document.querySelector(".contacts-list");
const messagesDiv = document.querySelector(".messages");

let username;
do{
    username = prompt("Please enter your username:");
} while(!username)

socket.emit("user joined", username);

socket.on("update userList", (users) => {
    contactsList.innerHTML = "";

    users.forEach((user) => {
        const contactItem = document.createElement("li");
        contactItem.className = "contact";

        const contactNameSpan = document.createElement("span");
        contactNameSpan.className = "contact-name"
        contactNameSpan.textContent = user;

        contactItem.appendChild(contactNameSpan);
        contactsList.append(contactItem);

    });
});

function sendMessage(){
    const message = messageInput.value;
    console.log(message);
    if(message.trim() !== ""){
        socket.emit("chat message", message);
        messageInput.value = "";
    }
};

document.getElementById("send-button").addEventListener("click", sendMessage);

socket.on("chat message", (msg) =>{

    const messageUser = msg.username;
    const message = msg.message;
    const messageType = messageUser === username ? "-sent" : "-received";

    const newMessageContainer = document.createElement("div");
    newMessageContainer.className = "message-container"+messageType;
    
    if(messageType === "-received"){
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "message-avatar";
        avatarDiv.textContent = messageUser[0].toUpperCase();
        newMessageContainer.appendChild(avatarDiv);
    }
    
    const newMessageDiv = document.createElement("div");
    newMessageDiv.className = "message"+messageType;
    newMessageDiv.textContent = `${message}`;

    newMessageContainer.appendChild(newMessageDiv);
    messagesDiv.appendChild(newMessageContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

messageInput.addEventListener('keydown', (event)=>{
    if(event.key === "Enter"){
        sendMessage();
    }
});



