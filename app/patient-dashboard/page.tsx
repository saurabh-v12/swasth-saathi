"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/contexts/socket-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, FileText, Pill, Calendar, Phone, Mail, AlertTriangle, Heart, Activity } from "lucide-react"
import type { PatientRecord } from "@/lib/data"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

function calculateAgeFromDOB(dob: string): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export default function PatientDashboard() {
  const { user, isAuthenticated } = useAuth()
  const { socket, isConnected } = useSocket()
  const { toast } = useToast()
  const router = useRouter()
  const [patientData, setPatientData] = useState<PatientRecord | null>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "patient") {
      router.push("/login")
      return
    }

    const fetchPatientData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/patient/ABHA1234`,
        )
        if (response.ok) {
          const data = await response.json()
          // Convert Express backend format to frontend format
          const patientRecord = {
            patientId: data.profile.id,
            patientName: data.profile.name,
            age: calculateAgeFromDOB(data.profile.dob),
            gender: data.profile.gender,
            bloodType: "O+", // Default value since not in backend
            contactNumber: "+91 9876543210", // Default value
            email: `${data.profile.username}@example.com`,
            allergies: [], // Default empty array
            medicalHistory: [], // Default empty array
            lastVisit: data.records.length > 0 ? data.records[data.records.length - 1].date : "2024-01-15",
          }
          setPatientData(patientRecord)
          setPrescriptions(data.prescriptions || [])
        } else {
          console.error("Failed to fetch patient data")
        }
      } catch (error) {
        console.error("Error fetching patient data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("update-prescriptions", (data) => {
        if (data.patientId === "ABHA1234") {
          setPrescriptions((prev) => [data.prescription, ...prev])
          toast({
            title: "New Prescription",
            description: "A new prescription has been added to your account.",
          })
        }
      })

      return () => {
        socket.off("update-prescriptions")
      }
    }
  }, [socket, isConnected, toast])

  if (!isAuthenticated || user?.role !== "patient") {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout title="Patient Dashboard" description="View your medical records and prescriptions">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your medical information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!patientData) {
    return (
      <DashboardLayout title="Patient Dashboard" description="View your medical records and prescriptions">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load your medical records. Please contact your healthcare provider.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout title="Patient Dashboard" description="View your medical records and prescriptions">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Real-time updates active" : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Patient Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patient ID</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientData.patientId}</div>
                <p className="text-xs text-muted-foreground">Your unique identifier</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientData.lastVisit}</div>
                <p className="text-xs text-muted-foreground">Most recent appointment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prescriptions.filter((p) => p.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">Current medications</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-lg">{patientData.patientName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p className="text-lg">{patientData.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gender</p>
                        <p className="text-lg capitalize">{patientData.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                        <p className="text-lg">{patientData.bloodType}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Contact Information</p>
                      <div className="space-y-2">
                        <p className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {patientData.contactNumber}
                        </p>
                        <p className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {patientData.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      Health Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {patientData.allergies.length > 0 ? (
                          patientData.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {allergy}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No known allergies</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Current Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {patientData.medicalHistory.length > 0 ? (
                          patientData.medicalHistory.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No current conditions</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Important Notes</p>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Always inform healthcare providers about your allergies and current medications before any
                          treatment.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="h-5 w-5 mr-2" />
                    Your Prescriptions
                  </CardTitle>
                  <CardDescription>View all your current and past prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions.map((prescription, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {prescription.medicine || prescription.diagnosis || "Prescription"}
                                </CardTitle>
                                <CardDescription>
                                  {prescription.date || prescription.dateIssued || new Date().toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <Badge variant="default">Active</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm">
                                  {prescription.prescription || prescription.text || "No details available"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No prescriptions found</p>
                      <p className="text-sm">Your prescriptions will appear here when issued by your doctor</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical-history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Medical History
                  </CardTitle>
                  <CardDescription>Your complete medical history and records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">CURRENT CONDITIONS</h4>
                      <div className="space-y-2">
                        {patientData.medicalHistory.length > 0 ? (
                          patientData.medicalHistory.map((condition, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <span>{condition}</span>
                              <Badge variant="secondary">Ongoing</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No current medical conditions recorded</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">ALLERGIES & REACTIONS</h4>
                      <div className="space-y-2">
                        {patientData.allergies.length > 0 ? (
                          patientData.allergies.map((allergy, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                            >
                              <span>{allergy}</span>
                              <Badge variant="destructive">Allergy</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No known allergies</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">RECENT VISITS</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">Regular Checkup</p>
                            <p className="text-sm text-muted-foreground">Dr. John Smith</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{patientData.lastVisit}</p>
                            <Badge variant="outline">Completed</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        This is a read-only view of your medical records. For any updates or corrections, please contact
                        your healthcare provider.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
