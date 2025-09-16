"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type User, type AuthState, getStoredUser, storeUser, clearUser } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })

  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setAuthState({
        user: storedUser,
        isAuthenticated: true,
      })
    }
  }, [])

  const login = (user: User) => {
    storeUser(user)
    setAuthState({
      user,
      isAuthenticated: true,
    })
  }

  const logout = () => {
    clearUser()
    setAuthState({
      user: null,
      isAuthenticated: false,
    })
  }

  return <AuthContext.Provider value={{ ...authState, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
