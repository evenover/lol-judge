// socket.js
import { io } from "socket.io-client";

// Dynamically determine the server's hostname
const serverHost = window.location.hostname;

// Use the dynamic hostname for the Socket.IO connection
const Socket = io(`http://${serverHost}:3000`, {
  autoConnect: false, // optional: you can manually connect
});

export default Socket;