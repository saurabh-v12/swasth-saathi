"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Users, Pill } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case "doctor":
          router.push("/doctor-dashboard")
          break
        case "patient":
          router.push("/patient-dashboard")
          break
        case "pharmacist":
          router.push("/pharmacist-dashboard")
          break
      }
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-primary">Swasth Saathi</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive healthcare management platform connecting doctors, patients, and pharmacists
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>For Doctors</CardTitle>
              <CardDescription>Manage patient records, prescriptions, and medical history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="h-8 w-8 text-secondary mx-auto mb-2" />
              <CardTitle>For Patients</CardTitle>
              <CardDescription>Access your medical records and prescription history</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Pill className="h-8 w-8 text-accent mx-auto mb-2" />
              <CardTitle>For Pharmacists</CardTitle>
              <CardDescription>View and manage patient prescriptions efficiently</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button onClick={() => router.push("/login")} size="lg" className="px-8 py-3 text-lg">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
