"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/contexts/socket-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Pill, User, AlertTriangle, CheckCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

interface Patient {
  id: string
  name: string
  age: number
  gender: string
}

interface Prescription {
  id: string
  patientId: string
  medicine: string
  dosage: string
  quantity: string
  date: string
}

export default function PharmacistDashboard() {
  const { user, isAuthenticated } = useAuth()
  const { socket, isConnected } = useSocket()
  const router = useRouter()
  const [patientId, setPatientId] = useState("")
  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [dispensedPrescriptions, setDispensedPrescriptions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "pharmacist") {
      router.push("/login")
      return
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (socket && isConnected) {
      const handleUpdatePrescriptions = (data: { patientId: string; prescription: Prescription }) => {
        console.log("[v0] Received update-prescriptions event:", data)

        // Only update if it's for the currently viewed patient
        if (patient && patient.id === data.patientId) {
          setPrescriptions((prev) => [data.prescription, ...prev])
        }
      }

      socket.on("update-prescriptions", handleUpdatePrescriptions)

      return () => {
        socket.off("update-prescriptions", handleUpdatePrescriptions)
      }
    }
  }, [socket, isConnected, patient])

  const handleFetchPatient = async () => {
    if (!patientId.trim()) {
      setError("Please enter a patient ID")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/patient/${patientId}`,
      )

      if (!response.ok) {
        if (response.status === 404) {
          setError("Patient not found")
        } else {
          setError("Failed to fetch patient data")
        }
        setPatient(null)
        setPrescriptions([])
        return
      }

      const data = await response.json()
      setPatient(data.patient)
      setPrescriptions(data.prescriptions || [])
      console.log("[v0] Fetched patient data:", data)
    } catch (err) {
      console.error("[v0] Error fetching patient:", err)
      setError("An error occurred while fetching patient data")
      setPatient(null)
      setPrescriptions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDispensePrescription = (prescriptionId: string) => {
    setDispensedPrescriptions(new Set([...dispensedPrescriptions, prescriptionId]))
  }

  return (
    <ProtectedRoute allowedRoles={["pharmacist"]}>
      <DashboardLayout title="Pharmacist Dashboard" description="View patient prescriptions and dispense medications">
        <div className="space-y-6">
          {/* Connection status indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Real-time updates active" : "Connecting..."}
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Patient
              </CardTitle>
              <CardDescription>Enter a patient ID to view their prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    placeholder="e.g., ABHA1234"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && handleFetchPatient()}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFetchPatient} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <span className="font-medium">ID:</span> {patient.id}
                    </p>
                    <p>
                      <span className="font-medium">Name:</span> {patient.name}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Age:</span> {patient.age} years
                    </p>
                    <p>
                      <span className="font-medium">Gender:</span> {patient.gender}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {patient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="h-5 w-5 mr-2" />
                  Prescriptions
                  <Badge variant="secondary" className="ml-2">
                    {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Prescriptions for {patient.name} • Updates automatically when new prescriptions are added
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <Card key={prescription.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{prescription.medicine}</CardTitle>
                              <CardDescription>Prescribed on {prescription.date}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              {dispensedPrescriptions.has(prescription.id) ? (
                                <Badge variant="default" className="bg-green-500">
                                  Dispensed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleDispensePrescription(prescription.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Dispense
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-sm text-muted-foreground">DOSAGE</span>
                                <p className="text-sm">{prescription.dosage}</p>
                              </div>
                              <div>
                                <span className="font-medium text-sm text-muted-foreground">QUANTITY</span>
                                <p className="text-sm">{prescription.quantity}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No prescriptions found for this patient</p>
                    <p className="text-sm mt-2">Monitoring for new prescriptions...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!patient && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Search for a Patient</h3>
                <p className="text-muted-foreground">
                  Enter a patient ID above to view their prescriptions with real-time updates
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
