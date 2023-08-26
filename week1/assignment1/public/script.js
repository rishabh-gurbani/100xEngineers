const socket = io();

const messageInput = document.getElementById("message-input");
const contactsList = document.querySelector(".contacts-list");
const messagesDiv = document.querySelector(".messages");
const commands = ["help", "random", "clear", "rem", "calc"];
const commandSuggestionsContainer = document.querySelector(".floating-commands-container");
const commandsList = {
    "help" : "Show available commands", 
    "random" : "Generate a random number",
    "clear" : "Clear the chat",
    "rem" : "Remember and recollect key values",
    "calc" : "Evaluate math expression"
}

let storedValues = {};

// username prompt
let username;
do{
    username = prompt("Please enter your username:");
} while(!username)
username = capitalizeFirstLetter(username);

socket.emit("user joined", username);

// socket functions

// new user entered chat
socket.on("update userList", (users) => {
    contactsList.innerHTML = "";

    const activeUsersCountDiv = document.querySelector(".active-users");
    if(users.length>0){
        const userVerb = users.length > 1 ? "users" : "user";
        activeUsersCountDiv.textContent = `${users.length} active ${userVerb}`;
    }

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
    displayMessage(messageUser, message, messageType);
});


socket.on("typing users", (users) => {
    users = users.filter((user) => user.toLowerCase() !== username.toLowerCase());
    const typingUsersSection = document.querySelector(".typing-users");
    const typingIndicator = typingUsersSection.querySelector(".typing-indicator");
    const typingText = typingUsersSection.querySelector(".typing-text");

    if (users.length === 0) {
        typingUsersSection.style.display = "none";
        typingIndicator.style.display = "none";
        typingText.textContent = "";
    } else if (users.length < 3) {
        typingUsersSection.style.display = "flex";
        typingIndicator.style.display = "block";
        typingText.textContent =
        users.length === 1 ? users[0] + " is typing" : users.join(", ") + " are typing";
    } else {
        typingUsersSection.style.display = "flex";
        typingIndicator.style.display = "block";
        typingText.textContent = "Multiple users are typing";
    }
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
messageInput.addEventListener("input", () => {
  const inputValue = messageInput.value.trim();
  commandSuggestionsContainer.innerHTML = "";

  if (inputValue.startsWith("/")) {
    const typedCommand = inputValue.slice(1);
    
    if (!typedCommand) {
      // Show all commands if input is just "/"
      console.log("showAll");
      showCommandsSuggestions(commands);
      commandSuggestionsContainer.style.display = "flex";
    } else {
        const matchedCommands = commands.filter(command => command.startsWith(typedCommand));
        if(matchedCommands.length!==0){
            showCommandsSuggestions(matchedCommands);
            commandSuggestionsContainer.style.display = "flex";
        }else{
            commandSuggestionsContainer.style.display = "none";
        }
    }
  } else {
    commandSuggestionsContainer.style.display = "none";
  }
});


// typing indicators
let typingTimeout;

messageInput.addEventListener('input', () => {
  clearTimeout(typingTimeout);

  if (messageInput.value) {
    if (!typingTimeout) {
      socket.emit('typing');
    }
    typingTimeout = setTimeout(() => {
      socket.emit('stoppedTyping');
      typingTimeout = null;
    }, 700); // Delay of 500 milliseconds
  } else {
    if (typingTimeout) {
      socket.emit('stoppedTyping');
      typingTimeout = null;
    }
  }
});



/* ------------------------  util functions --------------------------------*/

// common fn to execute when sending message
function sendMessage(){
    commandSuggestionsContainer.style.display="none";
    let message = messageInput.value;
    if(message.trim() !== ""){
        const isCommand = handleCommand(message.trim())
        if(!isCommand){
            message = replaceWithEmojis(message);
            socket.emit("chat message", message);
        }
        messageInput.value = "";
    }
}

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
    return replacedString;
}

function handleCommand(inputValue) {

    if (inputValue.startsWith("/")) {
        const parts = inputValue.slice(1).trim().split(" ");
        const command = parts[0];

        switch (command) {
            case "help":
                prompt("Available commands:\n/help - Show available commands\n/random - Generate a random number\n/rem - Remember and recollect key values\n/calc - Evaluate math expression\n/clear - Clear the chat.");
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

function displayMessage(messageUser, message, messageType, isCommand = false){
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
    if(isCommand) newMessage.classList.add("command");
    newMessage.textContent = message;
    newMessageDiv.appendChild(newMessage);
    
    newMessageContainer.appendChild(newMessageDiv);
    messagesDiv.appendChild(newMessageContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function displayCommandMessage(message){
    displayMessage("System", message, "-received", true);
}

function generateRandomNumber() {
    return Math.floor(Math.random() * 100) + 1;
}

function clearChat() {
    const divs = messagesDiv.querySelectorAll('div');
    
    divs.forEach((div) => {
      if (!div.classList.contains('floating-commands-container')) {
        div.remove();
      }});
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

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showCommandsSuggestions(commands) {
    console.log("show");
    commands.forEach(command => {
        const suggestionItem = document.createElement("div");

        const commandDef = document.createElement("div");
        commandDef.textContent = `/${command}`;
        commandDef.classList.add("command-definition");

        const commandPrompt = document.createElement("div");
        commandPrompt.textContent = commandsList[command];
        commandPrompt.classList.add("command-prompt");

        suggestionItem.classList.add("command-block");
        suggestionItem.appendChild(commandDef);
        suggestionItem.appendChild(commandPrompt);
        commandSuggestionsContainer.appendChild(suggestionItem);
    });
}
  
