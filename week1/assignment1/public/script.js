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
    if(message.trim() !== ""){
        socket.emit("chat message", message);
        messageInput.value = "";
    }
};

document.getElementById("send-button").addEventListener("click", sendMessage);

socket.on("chat message", (msg) =>{
    const newMessageDiv = document.createElement("div");
    newMessageDiv.className = "message received";
    newMessageDiv.textContent = `${msg.username} : ${msg.message}`;
    messagesDiv.appendChild(newMessageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

messageInput.addEventListener('keydown', (event)=>{
    if(event.key === "Enter"){
        sendMessage();
    }
});



