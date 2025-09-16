import type { Server as NetServer } from "http"
import type { NextApiResponse } from "next"
import { Server as ServerIO } from "socket.io"

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

let io: ServerIO | null = null

export const initSocket = (server: NetServer) => {
  if (!io) {
    io = new ServerIO(server, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("[v0] Socket connected:", socket.id)

      socket.on("join-role", (role: string) => {
        socket.join(`${role}-dashboard`)
        console.log("[v0] Socket joined room:", `${role}-dashboard`)
      })

      socket.on("disconnect", () => {
        console.log("[v0] Socket disconnected:", socket.id)
      })
    })
  }
  return io
}

export const getIO = () => io

export const broadcastMedicalRecordUpdate = (patientId: string, record: string) => {
  if (io) {
    io.to("patient-dashboard").emit("medicalRecordAdded", {
      patientId,
      record,
      timestamp: new Date().toISOString(),
    })
    io.to("pharmacist-dashboard").emit("medicalRecordAdded", {
      patientId,
      record,
      timestamp: new Date().toISOString(),
    })
  }
}

export const broadcastPrescriptionUpdate = (prescription: any) => {
  if (io) {
    io.to("patient-dashboard").emit("prescriptionAdded", {
      prescription,
      timestamp: new Date().toISOString(),
    })
    io.to("pharmacist-dashboard").emit("prescriptionAdded", {
      prescription,
      timestamp: new Date().toISOString(),
    })
  }
}
