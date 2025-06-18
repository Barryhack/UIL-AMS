import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
)

// Default users for testing
const users = [
  {
    email: "admin@unilorin.edu.ng",
    password: "admin123",
    role: "ADMIN",
    name: "Admin User"
  },
  {
    email: "lecturer@unilorin.edu.ng",
    password: "lecturer123",
    role: "LECTURER",
    name: "Lecturer User"
  },
  {
    email: "student@unilorin.edu.ng",
    password: "student123",
    role: "STUDENT",
    name: "Student User"
  }
]

export async function POST(request: Request) {
  try {
    console.log('Login attempt received')
    const body = await request.json()
    const { email, password } = body
    console.log('Login attempt for email:', email)

    // Find user with matching credentials
    const user = users.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      console.log('Invalid credentials for email:', email)
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    console.log('User found:', { email: user.email, role: user.role })

    // Generate JWT token using jose
    const token = await new jose.SignJWT({ 
      email: user.email,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Create the response
    const response = NextResponse.json({
      token,
      role: user.role,
      name: user.name
    })

    // Set HTTP-only cookie
    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 day
    })

    console.log('Login successful, token set in cookies')
    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 