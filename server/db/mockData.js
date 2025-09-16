// Mock in-memory database for Swasth Saathi Healthcare Management System
// This serves as a fake database with predefined users and patient data

// Mock Users Database
export const mockUsers = [
  // Doctor
  {
    id: "D001",
    username: "drmehta",
    password: "docpass123",
    name: "Dr. Mehta",
    role: "doctor",
  },

  // Pharmacist
  {
    id: "PH001",
    username: "pharma1",
    password: "pharmapass",
    name: "Pharma One",
    role: "pharmacist",
  },

  // Patient with ABHA1234 ID
  {
    id: "ABHA1234",
    username: "vishwakarma_4294@sbx",
    password: "saurabh4294!",
    name: "Saurabh Vishwakarma",
    dob: "1999-04-29",
    gender: "M",
    role: "patient",
    records: [
      {
        id: "R001",
        doctorId: "D001",
        note: "Initial checkup - healthy",
        date: "2025-09-10",
      },
    ],
    prescriptions: [
      {
        id: "PR001",
        doctorId: "D001",
        medicines: [
          {
            name: "Paracetamol",
            dose: "500mg",
            qty: "10",
          },
        ],
        date: "2025-09-10",
      },
    ],
  },
]

// Helper functions for data access
export const getUserByUsername = (username) => {
  return mockUsers.find((user) => user.username === username)
}

export const getUserById = (id) => {
  return mockUsers.find((user) => user.id === id)
}

export const getPatientById = (patientId) => {
  return mockUsers.find((user) => user.role === "patient" && user.id === patientId)
}

export const getAllPatients = () => {
  return mockUsers.filter((user) => user.role === "patient")
}

export const addPatientRecord = (patientId, record) => {
  const patient = getPatientById(patientId)
  if (patient) {
    patient.records.push(record)
    return true
  }
  return false
}

export const addPrescription = (patientId, prescription) => {
  const patient = getPatientById(patientId)
  if (patient) {
    patient.prescriptions.push(prescription)
    return true
  }
  return false
}

export const getPrescriptionsByPatientId = (patientId) => {
  const patient = getPatientById(patientId)
  return patient ? patient.prescriptions : []
}

export const getPatientByIdOrUsername = (idOrUsername) => {
  return mockUsers.find(
    (user) => user.role === "patient" && (user.id === idOrUsername || user.username === idOrUsername),
  )
}

export const generateRecordId = () => {
  const allRecords = mockUsers.filter((user) => user.role === "patient").flatMap((patient) => patient.records || [])
  const maxId = Math.max(...allRecords.map((r) => Number.parseInt(r.id.substring(1))), 0)
  return `R${String(maxId + 1).padStart(3, "0")}`
}

export const generatePrescriptionId = () => {
  const allPrescriptions = mockUsers
    .filter((user) => user.role === "patient")
    .flatMap((patient) => patient.prescriptions || [])
  const maxId = Math.max(...allPrescriptions.map((p) => Number.parseInt(p.id.substring(2))), 0)
  return `PR${String(maxId + 1).padStart(3, "0")}`
}

export const addRecordToPatient = (patientIdOrUsername, record) => {
  const patient = getPatientByIdOrUsername(patientIdOrUsername)
  if (patient) {
    if (!patient.records) patient.records = []
    patient.records.push(record)
    return record
  }
  return null
}

export const addPrescriptionToPatient = (patientIdOrUsername, prescription) => {
  const patient = getPatientByIdOrUsername(patientIdOrUsername)
  if (patient) {
    if (!patient.prescriptions) patient.prescriptions = []
    patient.prescriptions.push(prescription)
    return prescription
  }
  return null
}

// Authentication helper
export const authenticateUser = (username, password) => {
  const user = getUserByUsername(username)
  if (user && user.password === password) {
    // Return user without password for security
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  return null
}

export default mockUsers
