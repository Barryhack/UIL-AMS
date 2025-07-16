import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as jose from 'jose'
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
)

export async function POST(request: Request) {
  try {
    console.log('Login attempt received')
    const body = await request.json()
    const { email, password } = body
    console.log('Login attempt for email:', email)

    // Find user in the database by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('Invalid credentials for email:', email)
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Compare password (matric number) using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      console.log('Invalid password for email:', email)
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

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