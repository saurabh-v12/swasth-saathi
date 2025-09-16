export type UserRole = "doctor" | "patient" | "pharmacist"

export interface User {
  id: string
  username: string
  role: UserRole
  name: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Mock user data for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  "dr.smith": {
    password: "doctor123",
    user: {
      id: "1",
      username: "dr.smith",
      role: "doctor",
      name: "Dr. John Smith",
    },
  },
  patient1: {
    password: "patient123",
    user: {
      id: "2",
      username: "patient1",
      role: "patient",
      name: "Alice Johnson",
    },
  },
  pharma1: {
    password: "pharma123",
    user: {
      id: "3",
      username: "pharma1",
      role: "pharmacist",
      name: "Bob Wilson",
    },
  },
}

export const authenticate = (username: string, password: string, role: UserRole): User | null => {
  const userRecord = mockUsers[username]
  if (userRecord && userRecord.password === password && userRecord.user.role === role) {
    return userRecord.user
  }
  return null
}

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("swasth-saathi-user")
  return stored ? JSON.parse(stored) : null
}

export const storeUser = (user: User): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("swasth-saathi-user", JSON.stringify(user))
}

export const clearUser = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("swasth-saathi-user")
}
