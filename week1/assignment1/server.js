const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
let onlineUsers = [];

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user joined', (username) => {
    if(!onlineUsers.includes(username)){
      onlineUsers.push(username);
      socket.username = username;
      io.emit('update userList', onlineUsers);
    }
  });

  socket.on('disconnect', () => {
    console.log("user disconnected");
    if(socket.username){
      onlineUsers = onlineUsers.filter(user => user!==socket.username);
      io.emit("update userList", onlineUsers);
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', { username: socket.username, message : msg});
    // io.emit('chat message', msg);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
