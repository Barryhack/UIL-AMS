import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Create a new attendance session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "LECTURER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { courseId, scheduleId, startTime, endTime, type = "MANUAL", deviceId, location } = data

    // Validate course exists and user has access
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        ...(session.user.role === "LECTURER" ? { lecturerId: session.user.id } : {})
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // If device is specified, validate it exists and is assigned to the course
    if (deviceId) {
      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          assignedCourses: {
            some: { courseId }
          }
        }
      })

      if (!device) {
        return NextResponse.json({ error: "Invalid device" }, { status: 400 })
      }
    }

    // Create attendance session
    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId,
        scheduleId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        deviceId,
        location,
        status: "SCHEDULED"
      },
      include: {
        course: {
          select: {
            code: true,
            title: true
          }
        },
        device: {
          select: {
            name: true,
            serialNumber: true
          }
        }
      }
    })

    return NextResponse.json(attendanceSession)
  } catch (error) {
    console.error("Error in POST /api/attendance/sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get attendance sessions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where = {
      ...(courseId && { courseId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(from && to && {
        startTime: {
          gte: new Date(from),
          lte: new Date(to)
        }
      }),
      ...(session.user.role === "LECTURER" ? {
        course: {
          lecturerId: session.user.id
        }
      } : {}),
      ...(session.user.role === "STUDENT" ? {
        course: {
          enrollments: {
            some: {
              studentId: session.user.id,
              status: "ENROLLED"
            }
          }
        }
      } : {})
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        course: {
          select: {
            code: true,
            title: true,
            lecturer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        schedule: true,
        device: {
          select: {
            name: true,
            serialNumber: true,
            mode: true,
            status: true
          }
        },
        records: {
          select: {
            id: true,
            type: true,
            status: true,
            timestamp: true,
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: "desc"
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error in GET /api/attendance/sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 