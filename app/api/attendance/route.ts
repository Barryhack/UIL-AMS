import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for creating attendance session
const sessionSchema = z.object({
  courseId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const studentId = searchParams.get("studentId")
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    // Build filter based on query params and user role
    const filter: any = {}

    if (courseId) {
      filter.session = {
        courseId,
      }
    }

    if (date) {
      filter.session = {
        ...filter.session,
        date: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
      }
    }

    if (status) {
      filter.status = status
    }

    // If user is a student, only show their records
    if (session.user.role === "STUDENT") {
      filter.studentId = session.user.id
    }
    // If user is a lecturer, only show records for their courses
    else if (session.user.role === "LECTURER") {
      filter.session = {
        ...filter.session,
        course: {
          lecturerId: session.user.id,
        },
      }
    }
    // If admin is looking for a specific student
    else if (studentId) {
      filter.studentId = studentId
    }

    const records = await prisma.attendanceRecord.findMany({
      where: filter,
      include: {
        session: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            matricNumber: true,
          },
        },
        justification: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      records,
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch attendance records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only admins and lecturers can create attendance sessions
    if (session.user.role !== "ADMIN" && session.user.role !== "LECTURER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validatedData = sessionSchema.parse(body)

    // If lecturer, verify they teach this course
    if (session.user.role === "LECTURER") {
      const course = await prisma.course.findUnique({
        where: {
          id: validatedData.courseId,
          lecturerId: session.user.id,
        },
      })

      if (!course) {
        return NextResponse.json({ success: false, message: "You do not teach this course" }, { status: 403 })
      }
    }

    // Create the attendance session
    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId: validatedData.courseId,
        date: new Date(validatedData.date),
        startTime: new Date(`${validatedData.date}T${validatedData.startTime}`),
        endTime: new Date(`${validatedData.date}T${validatedData.endTime}`),
        location: validatedData.location,
        status: "SCHEDULED",
      },
    })

    // Log the session creation
    await prisma.auditLog.create({
      data: {
        action: "ATTENDANCE_SESSION_CREATED",
        details: `Session ${attendanceSession.id} created by ${session.user.id}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Attendance session created successfully",
      session: attendanceSession,
    })
  } catch (error) {
    console.error("Error creating attendance session:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to create attendance session" }, { status: 500 })
  }
}
