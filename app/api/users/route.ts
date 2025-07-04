import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Schema for user creation
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
  matricNumber: z.string().optional(),
  staffId: z.string().optional(),
  department: z.string().optional(),
  faculty: z.string().optional(),
  deviceId: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const query = searchParams.get("query")

    const users = await prisma.user.findMany({
      where: {
        AND: [
          role ? { role } : {},
          query ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { matricNumber: { contains: query } },
              { staffId: { contains: query } }
            ]
          } : {}
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        faculty: true,
        department: true,
        createdAt: true
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("[USERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = userSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email
      }
    })

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        deviceId: validatedData.deviceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        faculty: true,
        department: true,
        deviceId: true,
      }
    })

    return NextResponse.json({
      user
    })
  } catch (error: any) {
    console.error("[USERS_POST]", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}
