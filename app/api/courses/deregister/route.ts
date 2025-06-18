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

    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        studentId: session.user.id,
      },
    })

    if (!enrollment) {
      return new NextResponse("Not registered for this course", { status: 400 })
    }

    // Delete enrollment
    await prisma.courseEnrollment.delete({
      where: {
        id: enrollment.id,
      },
    })

    return new NextResponse("Successfully deregistered", { status: 200 })
  } catch (error) {
    console.error("[COURSE_DEREGISTRATION_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 