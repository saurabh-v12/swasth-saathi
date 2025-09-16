import type { NextRequest } from "next/server"
import { Server as ServerIO } from "socket.io"

export async function GET(req: NextRequest) {
  if (!global.io) {
    const httpServer = req as any
    global.io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    global.io.on("connection", (socket) => {
      console.log("[v0] Socket connected:", socket.id)

      socket.on("disconnect", () => {
        console.log("[v0] Socket disconnected:", socket.id)
      })
    })
  }

  return new Response("Socket server initialized", { status: 200 })
}

declare global {
  var io: ServerIO | undefined
}
