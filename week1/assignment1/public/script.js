const socket = io();

const messageInput = document.getElementById("message-input");
const contactsList = document.querySelector(".contacts-list");
const messagesDiv = document.querySelector(".messages");

let storedValues = {};

// username prompt
let username;
do{
    username = prompt("Please enter your username:");
} while(!username)

socket.emit("user joined", username);

// socket functions

// new user entered chat
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

// received new chat message
socket.on("chat message", (msg) =>{

    const messageUser = msg.username;
    const message = msg.message;
    const messageType = messageUser === username ? "-sent" : "-received";

    const newMessageContainer = document.createElement("div");
    newMessageContainer.className = "message-container"+messageType;

    const newMessageDiv = document.createElement("div");
    newMessageDiv.className = "message"+messageType;
    
    if(messageType === "-received"){
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "message-avatar";
        avatarDiv.textContent = messageUser[0].toUpperCase();
        newMessageContainer.appendChild(avatarDiv);

        const newMessageUser = document.createElement("div");
        newMessageUser.className = "message-user";
        newMessageUser.textContent = messageUser;
        newMessageDiv.appendChild(newMessageUser);
    }

    const newMessage = document.createElement("div");
    newMessage.className = "message";
    newMessage.textContent = message;
    newMessageDiv.appendChild(newMessage);
    
    newMessageContainer.appendChild(newMessageDiv);
    messagesDiv.appendChild(newMessageContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

});

/* -------------------  event listeners ----------------------------------*/

// enter button listener
messageInput.addEventListener('keydown', (event)=>{
    if(event.key === "Enter"){
        sendMessage();
    }
});

// send button listener
document.getElementById("send-button").addEventListener("click", sendMessage);

// slash command listener
// messageInput.addEventListener('input', handleInputChange);


/* ------------------------  util functions --------------------------------*/

// common fn to execute when sending message
function sendMessage(){
    let message = messageInput.value;
    if(message.trim() !== ""){
        const isCommand = handleCommand(message.trim())
        if(!isCommand){
            message = replaceWithEmojis(message);
            socket.emit("chat message", message);
        }
        messageInput.value = "";
    }
};

function replaceWithEmojis(message){
    const emojiMap = {
        react: "⚛️",
        woah: "😲",
        hey: "👋",
        lol: "😂",
        like: "🤍",
        congratulations: "🎉",
    };
    const regex = new RegExp(`\\b(${Object.keys(emojiMap).join('|')})\\b`, 'gi');
    const replacedString = message.replace(regex, match => emojiMap[match.toLowerCase()]);
    console.log(replacedString);
    return replacedString;
}

function handleCommand(inputValue) {

    if (inputValue.startsWith("/")) {
        const parts = inputValue.slice(1).trim().split(" ");
        const command = parts[0];

        switch (command) {
            case "help":
                prompt("Available commands:\n/help - Show available commands\n/random - Generate a random number\n/clear - Clear the chat.");
                break;
            case "random":
                const ran = generateRandomNumber();
                displayCommandMessage(`Here's your random number : ${ran}`)
                break;
            case "clear":
                clearChat();
                break;
            case "rem":
                handleRemCommand(parts);
                break;
            case "calc":
                handleCalcCommand(parts);
                break;
            default:
                displayCommandMessage("Unknown command. Type /help for available commands.");
        }

        return true;
    } else {
        return false;
    }
}

function displayCommandMessage(message){
    const messageType = "-received";

    const newMessageContainer = document.createElement("div");
    newMessageContainer.className = "message-container"+messageType;
    
    const avatarDiv = document.createElement("div");
    avatarDiv.className = "message-avatar";
    avatarDiv.textContent = "S";
    newMessageContainer.appendChild(avatarDiv);
    
    const newMessageDiv = document.createElement("div");
    newMessageDiv.className = "message"+messageType;
    newMessageDiv.textContent = `${message}`;

    newMessageContainer.appendChild(newMessageDiv);
    messagesDiv.appendChild(newMessageContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function generateRandomNumber() {
    return Math.floor(Math.random() * 100) + 1;
}

function clearChat() {
    messagesDiv.innerHTML = "";
}

function handleRemCommand(parts) {
    if (parts.length === 2) {
        const name = parts[1];
        const storedValue = storedValues[name];
        if (storedValue !== undefined) {
            displayCommandMessage(`${name}: ${storedValue}`);
        } else {
            displayCommandMessage(`No value stored for ${name}.`);
        }
    } else if (parts.length >= 3) {
        const name = parts[1];
        const value = parts.slice(2).join(" ");
        storedValues[name] = value;
        displayCommandMessage(`Stored value "${value}" with name "${name}".`);
    } else {
        displayCommandMessage("Invalid /rem command. Usage: /rem <name> <value>");
    }
}


function handleCalcCommand(parts) {
    if (parts.length === 2) {
        try {
            const result = eval(parts[1]);
            displayCommandMessage(`Calculation result: ${result}`);
        } catch (error) {
            displayCommandMessage("Error performing calculation.");
        }
    } else {
        displayCommandMessage("Invalid /calc command. Usage: /calc <expression>");
    }
}
