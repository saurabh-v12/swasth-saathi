export interface PatientRecord {
  id: string
  patientId: string
  patientName: string
  age: number
  gender: "male" | "female" | "other"
  bloodType: string
  allergies: string[]
  medicalHistory: string[]
  lastVisit: string
  contactNumber: string
  email: string
}

export interface Prescription {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }[]
  diagnosis: string
  notes: string
  dateIssued: string
  status: "active" | "completed" | "cancelled"
}

// Mock data for demonstration
export const mockPatients: PatientRecord[] = [
  {
    id: "p1",
    patientId: "PAT001",
    patientName: "Alice Johnson",
    age: 32,
    gender: "female",
    bloodType: "A+",
    allergies: ["Penicillin", "Shellfish"],
    medicalHistory: ["Hypertension", "Diabetes Type 2"],
    lastVisit: "2024-01-15",
    contactNumber: "+1-555-0123",
    email: "alice.johnson@email.com",
  },
  {
    id: "p2",
    patientId: "PAT002",
    patientName: "Bob Smith",
    age: 45,
    gender: "male",
    bloodType: "O-",
    allergies: ["Latex"],
    medicalHistory: ["Asthma", "High Cholesterol"],
    lastVisit: "2024-01-20",
    contactNumber: "+1-555-0124",
    email: "bob.smith@email.com",
  },
  {
    id: "p3",
    patientId: "PAT003",
    patientName: "Carol Davis",
    age: 28,
    gender: "female",
    bloodType: "B+",
    allergies: [],
    medicalHistory: ["Migraine"],
    lastVisit: "2024-01-18",
    contactNumber: "+1-555-0125",
    email: "carol.davis@email.com",
  },
  {
    id: "p4",
    patientId: "ABHA1234",
    patientName: "Saurabh Vishwakarma",
    age: 25,
    gender: "male",
    bloodType: "O+",
    allergies: [],
    medicalHistory: ["Initial checkup - healthy"],
    lastVisit: "2024-01-22",
    contactNumber: "+1-555-0126",
    email: "saurabh.vishwakarma@email.com",
  },
]

export const mockPrescriptions: Prescription[] = [
  {
    id: "rx1",
    patientId: "PAT001",
    patientName: "Alice Johnson",
    doctorId: "1",
    doctorName: "Dr. John Smith",
    medications: [
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "30 days",
        instructions: "Take with meals",
      },
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take in the morning",
      },
    ],
    diagnosis: "Diabetes Type 2, Hypertension",
    notes: "Monitor blood sugar levels regularly",
    dateIssued: "2024-01-15",
    status: "active",
  },
  {
    id: "rx2",
    patientId: "PAT002",
    patientName: "Bob Smith",
    doctorId: "1",
    doctorName: "Dr. John Smith",
    medications: [
      {
        name: "Albuterol Inhaler",
        dosage: "90mcg",
        frequency: "As needed",
        duration: "30 days",
        instructions: "Use during asthma attacks",
      },
    ],
    diagnosis: "Asthma exacerbation",
    notes: "Follow up in 2 weeks",
    dateIssued: "2024-01-20",
    status: "active",
  },
  {
    id: "rx3",
    patientId: "ABHA1234",
    patientName: "Saurabh Vishwakarma",
    doctorId: "1",
    doctorName: "Dr. John Smith",
    medications: [
      {
        name: "Vitamin D3",
        dosage: "1000 IU",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take with food",
      },
    ],
    diagnosis: "Vitamin D deficiency",
    notes: "Regular checkup recommended",
    dateIssued: "2024-01-22",
    status: "active",
  },
]

export const getPatientById = (patientId: string): PatientRecord | undefined => {
  return mockPatients.find((patient) => patient.patientId === patientId)
}

export const getPatientByIdOrUsername = (query: string): PatientRecord | undefined => {
  const lowerQuery = query.toLowerCase()
  return mockPatients.find(
    (patient) =>
      patient.patientId.toLowerCase() === lowerQuery || patient.patientName.toLowerCase().includes(lowerQuery),
  )
}

export const getPrescriptionsByPatientId = (patientId: string): Prescription[] => {
  return mockPrescriptions.filter((prescription) => prescription.patientId === patientId)
}

export const getAllPrescriptions = (): Prescription[] => {
  return mockPrescriptions
}

export const updatePatientMedicalHistory = (patientId: string, newRecord: string): PatientRecord | null => {
  const patientIndex = mockPatients.findIndex((patient) => patient.patientId === patientId)

  if (patientIndex !== -1) {
    mockPatients[patientIndex].medicalHistory.push(newRecord)
    mockPatients[patientIndex].lastVisit = new Date().toISOString().split("T")[0]
    return mockPatients[patientIndex]
  }

  return null
}

export const addPatientRecord = (record: Omit<PatientRecord, "id">): PatientRecord => {
  const newRecord = {
    ...record,
    id: `p${mockPatients.length + 1}`,
  }
  mockPatients.push(newRecord)
  return newRecord
}

export const addPrescription = (prescription: Omit<Prescription, "id">): Prescription => {
  const newPrescription = {
    ...prescription,
    id: `rx${mockPrescriptions.length + 1}`,
  }
  mockPrescriptions.push(newPrescription)
  return newPrescription
}
