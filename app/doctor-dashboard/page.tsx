"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/contexts/socket-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, FileText, Pill, User, Calendar, Phone, Mail, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PatientRecord {
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

interface Prescription {
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

export default function DoctorDashboard() {
  const { user, isAuthenticated } = useAuth()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([])
  const [searchError, setSearchError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [newMedicalRecord, setNewMedicalRecord] = useState("")
  const [isAddingRecord, setIsAddingRecord] = useState(false)

  const [simplePrescriptionForm, setSimplePrescriptionForm] = useState({
    patientId: "",
    prescription: "",
  })
  const [isAddingSimplePrescription, setIsAddingSimplePrescription] = useState(false)

  const [newPrescriptionForm, setNewPrescriptionForm] = useState({
    medications: [{ name: "", dosage: "", quantity: "" }],
    diagnosis: "",
    notes: "",
  })
  const [isAddingPrescription, setIsAddingPrescription] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "doctor") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("medicalRecordAdded", (data) => {
        if (selectedPatient && data.patientId === selectedPatient.patientId) {
          toast({
            title: "Medical Record Updated",
            description: "A new medical record has been added.",
          })
          // Refresh patient data
          handleSearchPatient()
        }
      })

      socket.on("prescriptionAdded", (data) => {
        if (selectedPatient && data.prescription.patientId === selectedPatient.patientId) {
          setPatientPrescriptions((prev) => [...prev, data.prescription])
          toast({
            title: "Prescription Added",
            description: "New prescription has been added successfully.",
          })
        }
      })

      return () => {
        socket.off("medicalRecordAdded")
        socket.off("prescriptionAdded")
      }
    }
  }, [socket, isConnected, selectedPatient, toast])

  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a Patient ID or username")
      return
    }

    setIsLoading(true)
    setSearchError("")

    try {
      const response = await fetch(`/api/patient/${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedPatient(data.patient)
        setPatientPrescriptions(data.prescriptions || [])
        toast({
          title: "Patient Found",
          description: `Loaded data for ${data.patient.patientName}`,
        })
      } else {
        setSelectedPatient(null)
        setPatientPrescriptions([])
        setSearchError(data.error || "Patient not found")
      }
    } catch (error) {
      console.error("Error searching patient:", error)
      setSearchError("Failed to search patient. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMedicalRecord = async () => {
    if (!selectedPatient || !newMedicalRecord.trim() || !user) return

    setIsAddingRecord(true)
    try {
      const response = await fetch("/api/doctor/addRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          record: newMedicalRecord.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedPatient(data.patient)
        setNewMedicalRecord("")
        toast({
          title: "Medical Record Added",
          description: "New medical record has been added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add medical record",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding medical record:", error)
      toast({
        title: "Error",
        description: "Failed to add medical record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingRecord(false)
    }
  }

  const handleAddPrescription = async () => {
    if (!selectedPatient || !user) return

    const validMedications = newPrescriptionForm.medications.filter((med) => med.name.trim())
    if (validMedications.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one medication",
        variant: "destructive",
      })
      return
    }

    setIsAddingPrescription(true)
    try {
      const response = await fetch("/api/doctor/addPrescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          patientName: selectedPatient.patientName,
          doctorId: user.id,
          doctorName: user.name,
          medications: validMedications.map((med) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: "As prescribed",
            duration: "As needed",
            instructions: `Quantity: ${med.quantity}`,
          })),
          diagnosis: newPrescriptionForm.diagnosis,
          notes: newPrescriptionForm.notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPatientPrescriptions((prev) => [...prev, data.prescription])
        setNewPrescriptionForm({
          medications: [{ name: "", dosage: "", quantity: "" }],
          diagnosis: "",
          notes: "",
        })
        toast({
          title: "Prescription Added",
          description: "New prescription has been added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add prescription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding prescription:", error)
      toast({
        title: "Error",
        description: "Failed to add prescription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingPrescription(false)
    }
  }

  const handleAddSimplePrescription = async () => {
    if (!simplePrescriptionForm.patientId.trim() || !simplePrescriptionForm.prescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both Patient ID and prescription text",
        variant: "destructive",
      })
      return
    }

    setIsAddingSimplePrescription(true)
    try {
      const response = await fetch("/api/add-prescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: simplePrescriptionForm.patientId.trim(),
          prescription: simplePrescriptionForm.prescription.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSimplePrescriptionForm({
          patientId: "",
          prescription: "",
        })
        toast({
          title: "Prescription Added",
          description: "Prescription has been added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add prescription",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding prescription:", error)
      toast({
        title: "Error",
        description: "Failed to add prescription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingSimplePrescription(false)
    }
  }

  const addMedicationField = () => {
    setNewPrescriptionForm({
      ...newPrescriptionForm,
      medications: [...newPrescriptionForm.medications, { name: "", dosage: "", quantity: "" }],
    })
  }

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DashboardLayout title="Doctor Dashboard" description="Manage patient records and prescriptions">
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Real-time updates active" : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Patient
              </CardTitle>
              <CardDescription>Enter a Patient ID or username to view records and prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="searchQuery">Patient ID or Username</Label>
                  <Input
                    id="searchQuery"
                    placeholder="e.g., PAT001 or Alice Johnson"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearchPatient()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearchPatient} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
              {searchError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          {selectedPatient && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">PATIENT DETAILS</h4>
                        <div className="mt-2 space-y-2">
                          <p>
                            <span className="font-medium">ID:</span> {selectedPatient.patientId}
                          </p>
                          <p>
                            <span className="font-medium">Name:</span> {selectedPatient.patientName}
                          </p>
                          <p>
                            <span className="font-medium">Age:</span> {selectedPatient.age} years
                          </p>
                          <p>
                            <span className="font-medium">Gender:</span> {selectedPatient.gender}
                          </p>
                          <p>
                            <span className="font-medium">Blood Type:</span> {selectedPatient.bloodType}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">CONTACT INFORMATION</h4>
                        <div className="mt-2 space-y-2">
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedPatient.contactNumber}
                          </p>
                          <p className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedPatient.email}
                          </p>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            Last Visit: {selectedPatient.lastVisit}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">ALLERGIES</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPatient.allergies.length > 0 ? (
                            selectedPatient.allergies.map((allergy, index) => (
                              <Badge key={index} variant="destructive">
                                {allergy}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No known allergies</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">MEDICAL HISTORY</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPatient.medicalHistory.length > 0 ? (
                            selectedPatient.medicalHistory.map((condition, index) => (
                              <Badge key={index} variant="secondary">
                                {condition}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No medical history recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Medical Record Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Add Medical Record
                  </CardTitle>
                  <CardDescription>Add a new medical record for this patient</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medicalRecord">Medical Record</Label>
                      <Textarea
                        id="medicalRecord"
                        placeholder="Enter medical record details..."
                        value={newMedicalRecord}
                        onChange={(e) => setNewMedicalRecord(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddMedicalRecord} disabled={!newMedicalRecord.trim() || isAddingRecord}>
                      {isAddingRecord ? "Adding..." : "Add Medical Record"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Add Prescription Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Add Prescription
                  </CardTitle>
                  <CardDescription>Create a new prescription for {selectedPatient.patientName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        placeholder="Enter diagnosis..."
                        value={newPrescriptionForm.diagnosis}
                        onChange={(e) => setNewPrescriptionForm({ ...newPrescriptionForm, diagnosis: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Medications</Label>
                      {newPrescriptionForm.medications.map((med, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 mt-2">
                          <Input
                            placeholder="Medicine name"
                            value={med.name}
                            onChange={(e) => {
                              const newMeds = [...newPrescriptionForm.medications]
                              newMeds[index].name = e.target.value
                              setNewPrescriptionForm({ ...newPrescriptionForm, medications: newMeds })
                            }}
                          />
                          <Input
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => {
                              const newMeds = [...newPrescriptionForm.medications]
                              newMeds[index].dosage = e.target.value
                              setNewPrescriptionForm({ ...newPrescriptionForm, medications: newMeds })
                            }}
                          />
                          <Input
                            placeholder="Quantity"
                            value={med.quantity}
                            onChange={(e) => {
                              const newMeds = [...newPrescriptionForm.medications]
                              newMeds[index].quantity = e.target.value
                              setNewPrescriptionForm({ ...newPrescriptionForm, medications: newMeds })
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMedicationField}
                        className="mt-2 bg-transparent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes..."
                        value={newPrescriptionForm.notes}
                        onChange={(e) => setNewPrescriptionForm({ ...newPrescriptionForm, notes: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleAddPrescription} disabled={isAddingPrescription}>
                      {isAddingPrescription ? "Adding..." : "Add Prescription"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Prescriptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Prescriptions
                  </CardTitle>
                  <CardDescription>Active and past prescriptions for this patient</CardDescription>
                </CardHeader>
                <CardContent>
                  {patientPrescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {patientPrescriptions.map((prescription) => (
                        <Card key={prescription.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{prescription.diagnosis}</CardTitle>
                                <CardDescription>
                                  Prescribed by {prescription.doctorName} on {prescription.dateIssued}
                                </CardDescription>
                              </div>
                              <Badge variant={prescription.status === "active" ? "default" : "secondary"}>
                                {prescription.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-sm text-muted-foreground mb-2">MEDICATIONS</h5>
                                <div className="space-y-2">
                                  {prescription.medications.map((med, index) => (
                                    <div key={index} className="bg-muted p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{med.name}</span>
                                        <span className="text-sm text-muted-foreground">{med.dosage}</span>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        <span>{med.frequency}</span> • <span>{med.duration}</span>
                                      </div>
                                      {med.instructions && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          <span className="font-medium">Instructions:</span> {med.instructions}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {prescription.notes && (
                                <div>
                                  <h5 className="font-medium text-sm text-muted-foreground mb-1">NOTES</h5>
                                  <p className="text-sm">{prescription.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No prescriptions found for this patient</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Add Prescription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="h-5 w-5 mr-2" />
                Quick Add Prescription
              </CardTitle>
              <CardDescription>Add a prescription for any patient</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    placeholder="Enter patient ID (e.g., ABHA1234)"
                    value={simplePrescriptionForm.patientId}
                    onChange={(e) =>
                      setSimplePrescriptionForm({
                        ...simplePrescriptionForm,
                        patientId: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="prescription">Prescription</Label>
                  <Textarea
                    id="prescription"
                    placeholder="Enter prescription details..."
                    value={simplePrescriptionForm.prescription}
                    onChange={(e) =>
                      setSimplePrescriptionForm({
                        ...simplePrescriptionForm,
                        prescription: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddSimplePrescription} disabled={isAddingSimplePrescription}>
                  {isAddingSimplePrescription ? "Adding..." : "Add Prescription"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {!selectedPatient && !searchError && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Search for a Patient</h3>
                <p className="text-muted-foreground">
                  Enter a Patient ID or username above to view their records and prescriptions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
