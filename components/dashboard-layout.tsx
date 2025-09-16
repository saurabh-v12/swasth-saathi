"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Heart, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, description }) => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-2xl font-bold text-primary">Swasth Saathi</h1>
              </div>
              <div className="hidden md:block">
                <span className="text-muted-foreground">|</span>
                <span className="ml-4 text-lg font-medium">{title}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground capitalize">({user?.role})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
