import { type NextRequest, NextResponse } from "next/server"

// Mock user data for authentication
const mockUsers = [
  {
    id: "D001",
    username: "drmehta",
    password: "docpass123",
    name: "Dr. Mehta",
    role: "doctor",
  },
  {
    id: "PH001",
    username: "pharma1",
    password: "pharmapass",
    name: "Pharma One",
    role: "pharmacist",
  },
  {
    id: "P001",
    username: "vishwakarma_4294@sbx",
    password: "saurabh4294!",
    name: "Saurabh Vishwakarma",
    role: "patient",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { role, username, password } = await request.json()

    // Validate required fields
    if (!role || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Role, username, and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by username and validate credentials
    const user = mockUsers.find((u) => u.username === username && u.password === password && u.role === role)

    if (user) {
      // Return success response with user data (excluding password)
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({
        success: true,
        user: userWithoutPassword,
      })
    } else {
      // Return error response for invalid credentials
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials. Please check your username, password, and role.",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login. Please try again.",
      },
      { status: 500 },
    )
  }
}
