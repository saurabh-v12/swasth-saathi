import { io } from "socket.io-client"

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5,
})

socket.on("connect", () => {
  console.log("connected")
})

socket.on("disconnect", () => {
  console.log("disconnected")
})

export default socket
