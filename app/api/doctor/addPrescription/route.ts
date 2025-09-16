import { type NextRequest, NextResponse } from "next/server"
import { addPrescription } from "@/lib/data"
import { broadcastPrescriptionUpdate } from "@/lib/socket"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patientName, doctorId, doctorName, medications, diagnosis, notes } = body

    if (!patientId || !medications || medications.length === 0) {
      return NextResponse.json({ error: "Patient ID and medications are required" }, { status: 400 })
    }

    // Create new prescription
    const newPrescription = addPrescription({
      patientId,
      patientName,
      doctorId,
      doctorName,
      medications: medications.filter((med: any) => med.name.trim()),
      diagnosis: diagnosis || "",
      notes: notes || "",
      dateIssued: new Date().toISOString().split("T")[0],
      status: "active",
    })

    broadcastPrescriptionUpdate(newPrescription)

    return NextResponse.json({
      success: true,
      prescription: newPrescription,
    })
  } catch (error) {
    console.error("Error adding prescription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
