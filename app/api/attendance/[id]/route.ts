import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for updating attendance session
const updateSessionSchema = z.object({
  status: z.enum(["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  location: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: {
        id: params.id,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            lecturer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        records: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                matricNumber: true,
              },
            },
          },
        },
      },
    })

    if (!attendanceSession) {
      return NextResponse.json({ success: false, message: "Attendance session not found" }, { status: 404 })
    }

    // If user is a lecturer, verify they teach this course
    if (session.user.role === "LECTURER" && attendanceSession.course.lecturer.id !== session.user.id) {
      return NextResponse.json({ success: false, message: "You do not teach this course" }, { status: 403 })
    }

    // If user is a student, verify they are enrolled in this course
    if (session.user.role === "STUDENT") {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          studentId: session.user.id,
          courseId: attendanceSession.course.id,
        },
      })

      if (!enrollment) {
        return NextResponse.json({ success: false, message: "You are not enrolled in this course" }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: true,
      session: attendanceSession,
    })
  } catch (error) {
    console.error("Error fetching attendance session:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch attendance session" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only admins and lecturers can update attendance sessions
    if (session.user.role !== "ADMIN" && session.user.role !== "LECTURER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: {
        id: params.id,
      },
      include: {
        course: true,
      },
    })

    if (!attendanceSession) {
      return NextResponse.json({ success: false, message: "Attendance session not found" }, { status: 404 })
    }

    // If lecturer, verify they teach this course
    if (session.user.role === "LECTURER" && attendanceSession.course.lecturerId !== session.user.id) {
      return NextResponse.json({ success: false, message: "You do not teach this course" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validatedData = updateSessionSchema.parse(body)

    // Update the attendance session
    const updatedSession = await prisma.attendanceSession.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    })

    // Log the session update
    await prisma.auditLog.create({
      data: {
        action: "ATTENDANCE_SESSION_UPDATED",
        details: `Session ${updatedSession.id} updated by ${session.user.id}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Attendance session updated successfully",
      session: updatedSession,
    })
  } catch (error) {
    console.error("Error updating attendance session:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to update attendance session" }, { status: 500 })
  }
}
