// socket.js
import { io } from "socket.io-client";

const Socket = io("http://localhost:3000", {
  autoConnect: false, // optional: you can manually connect
});

export default Socket;