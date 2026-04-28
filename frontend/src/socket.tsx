// socket.js
import { io } from "socket.io-client";

const serverHost = window.location.hostname;
const socketUrl = import.meta.env.DEV ? `http://${serverHost}:3000` : undefined;

const Socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});

export default Socket;