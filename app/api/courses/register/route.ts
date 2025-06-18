import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { courseId } = await req.json()

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 })
    }

    // Check if already registered
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        studentId: session.user.id,
      },
    })

    if (existingEnrollment) {
      return new NextResponse("Already registered for this course", { status: 400 })
    }

    // Create enrollment
    await prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId: session.user.id,
        status: "ENROLLED",
      },
    })

    return new NextResponse("Successfully registered", { status: 200 })
  } catch (error) {
    console.error("[COURSE_REGISTRATION_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 