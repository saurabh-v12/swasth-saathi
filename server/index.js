import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import {
  authenticateUser,
  getPatientByIdOrUsername,
  addRecordToPatient,
  addPrescriptionToPatient,
  generateRecordId,
  generatePrescriptionId,
} from "./db/mockData.js"

const app = express()
const PORT = process.env.PORT || 4000

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Handle joining patient-specific rooms
  socket.on("joinPatientRoom", (patientId) => {
    socket.join(`patient_${patientId}`)
    console.log(`User ${socket.id} joined room: patient_${patientId}`)
  })

  // Handle leaving patient-specific rooms
  socket.on("leavePatientRoom", (patientId) => {
    socket.leave(`patient_${patientId}`)
    console.log(`User ${socket.id} left room: patient_${patientId}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

app.post("/api/login", (req, res) => {
  try {
    const { role, username, password } = req.body

    // Validate required fields
    if (!role || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Role, username, and password are required",
      })
    }

    // Authenticate user using mock data
    const user = authenticateUser(username, password)

    if (user && user.role === role) {
      // Return success response with user data (excluding sensitive info)
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      })
    } else {
      // Return error response for invalid credentials
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" })
})

app.get("/api/patient/:id", (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID or username is required",
      })
    }

    const patient = getPatientByIdOrUsername(id)

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    // Return patient data in the requested format
    const response = {
      profile: {
        id: patient.id,
        name: patient.name,
        username: patient.username,
        dob: patient.dob,
        gender: patient.gender,
      },
      records: patient.records || [],
      prescriptions: patient.prescriptions || [],
    }

    return res.json(response)
  } catch (error) {
    console.error("Get patient error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

app.post("/api/add-record", (req, res) => {
  try {
    const { patientId, record } = req.body

    // Validate required fields
    if (!patientId || !record) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and record are required",
      })
    }

    // Create new record with generated ID
    const newRecord = {
      id: generateRecordId(),
      ...record,
      date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    }

    // Add record to patient
    const addedRecord = addRecordToPatient(patientId, newRecord)

    if (!addedRecord) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    const patient = getPatientByIdOrUsername(patientId)
    if (patient) {
      // Emit real-time event to patient room
      io.to(`patient_${patient.id}`).emit("update-records", {
        patientId: patient.id,
        record: addedRecord,
      })
      console.log(`Emitted update-records event to room: patient_${patient.id}`)
    }

    return res.status(201).json(addedRecord)
  } catch (error) {
    console.error("Add record error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

app.post("/api/add-prescription", (req, res) => {
  try {
    const { patientId, prescription } = req.body

    // Validate required fields
    if (!patientId || !prescription) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and prescription are required",
      })
    }

    // Create new prescription with generated ID
    const newPrescription = {
      id: generatePrescriptionId(),
      ...prescription,
      date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    }

    // Add prescription to patient
    const addedPrescription = addPrescriptionToPatient(patientId, newPrescription)

    if (!addedPrescription) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    const patient = getPatientByIdOrUsername(patientId)
    if (patient) {
      // Emit real-time event to patient room
      io.to(`patient_${patient.id}`).emit("update-prescriptions", {
        patientId: patient.id,
        prescription: addedPrescription,
      })
      console.log(`Emitted update-prescriptions event to room: patient_${patient.id}`)
    }

    return res.status(201).json(addedPrescription)
  } catch (error) {
    console.error("Add prescription error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
