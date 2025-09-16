import { type NextRequest, NextResponse } from "next/server"
import { updatePatientMedicalHistory } from "@/lib/data"
import { broadcastMedicalRecordUpdate } from "@/lib/socket"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, record } = body

    if (!patientId || !record) {
      return NextResponse.json({ error: "Patient ID and record are required" }, { status: 400 })
    }

    const updatedPatient = updatePatientMedicalHistory(patientId, record)

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    broadcastMedicalRecordUpdate(patientId, record)

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
    })
  } catch (error) {
    console.error("Error adding medical record:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
