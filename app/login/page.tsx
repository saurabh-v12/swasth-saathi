"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, User, Lock, UserCheck } from "lucide-react"

type UserRole = "doctor" | "patient" | "pharmacist"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole | "">("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!username || !password || !role) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      // Call the API login endpoint
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          username,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store user information in localStorage
        localStorage.setItem("user", JSON.stringify(data.user))

        // Update auth context
        login(data.user)

        // Redirect to appropriate dashboard based on role
        switch (data.user.role) {
          case "doctor":
            router.push("/doctor-dashboard")
            break
          case "patient":
            router.push("/patient-dashboard")
            break
          case "pharmacist":
            router.push("/pharmacist-dashboard")
            break
          default:
            setError("Invalid user role")
        }
      } else {
        setError(data.message || "Invalid credentials. Please check your username, password, and role.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-10 w-10 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-primary">Swasth Saathi</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your healthcare account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Doctor
                      </div>
                    </SelectItem>
                    <SelectItem value="patient">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Patient
                      </div>
                    </SelectItem>
                    <SelectItem value="pharmacist">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        Pharmacist
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Doctor: drmehta / docpass123</p>
                <p>Patient: vishwakarma_4294@sbx / saurabh4294!</p>
                <p>Pharmacist: pharma1 / pharmapass</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
