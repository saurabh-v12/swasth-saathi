import { type NextRequest, NextResponse } from "next/server"
import { getPatientByIdOrUsername, getPrescriptionsByPatientId } from "@/lib/data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const query = params.id

    const patient = getPatientByIdOrUsername(query)

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Get patient's prescriptions
    const prescriptions = getPrescriptionsByPatientId(patient.patientId)

    return NextResponse.json({
      patient,
      prescriptions,
      medicalRecords: patient.medicalHistory || [],
    })
  } catch (error) {
    console.error("Error fetching patient:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
