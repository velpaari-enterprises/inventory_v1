import { io } from "socket.io-client";

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const socketUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const socket = io(socketUrl, {
  transports: ["websocket"],
  autoConnect: true
});
