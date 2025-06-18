import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { sessionId, deviceId, studentId, type = "IN", metadata } = data

    // Validate attendance session exists and is active
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        status: "ACTIVE",
        startTime: { lte: new Date() },
        endTime: { gte: new Date() }
      },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                studentId,
                status: "ENROLLED"
              }
            }
          }
        }
      }
    })

    if (!attendanceSession) {
      return NextResponse.json({ error: "Invalid or inactive attendance session" }, { status: 400 })
    }

    // Verify student is enrolled in the course
    if (attendanceSession.course.enrollments.length === 0) {
      return NextResponse.json({ error: "Student not enrolled in this course" }, { status: 400 })
    }

    // Verify device is assigned to the course
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        assignedCourses: {
          some: { courseId: attendanceSession.courseId }
        }
      }
    })

    if (!device) {
      return NextResponse.json({ error: "Invalid device for this course" }, { status: 400 })
    }

    // Check for existing record in this session
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        sessionId,
        studentId,
        type
      }
    })

    if (existingRecord) {
      return NextResponse.json({ error: "Attendance already recorded" }, { status: 400 })
    }

    // Create attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        deviceId,
        studentId,
        type,
        status: device.mode === "OFFLINE" ? "PENDING" : "APPROVED",
        syncedAt: device.mode === "ONLINE" ? new Date() : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        student: {
          select: {
            name: true,
            matricNumber: true
          }
        },
        session: {
          select: {
            course: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error in POST /api/attendance/record:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Sync offline attendance records
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { deviceId, records } = data

    // Validate device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    })

    if (!device) {
      return NextResponse.json({ error: "Invalid device" }, { status: 400 })
    }

    // Process each record
    const processedRecords = await Promise.all(
      records.map(async (record: any) => {
        const { sessionId, studentId, type, timestamp, metadata } = record

        // Validate session and enrollment
        const session = await prisma.attendanceSession.findFirst({
          where: {
            id: sessionId,
            course: {
              enrollments: {
                some: {
                  studentId,
                  status: "ENROLLED"
                }
              }
            }
          }
        })

        if (!session) {
          return { ...record, error: "Invalid session or student not enrolled" }
        }

        try {
          const attendanceRecord = await prisma.attendanceRecord.create({
            data: {
              sessionId,
              deviceId,
              studentId,
              type,
              timestamp: new Date(timestamp),
              status: "APPROVED",
              syncedAt: new Date(),
              metadata: metadata ? JSON.stringify(metadata) : null
            }
          })
          return attendanceRecord
        } catch (error) {
          return { ...record, error: "Failed to process record" }
        }
      })
    )

    // Update device sync time
    await prisma.device.update({
      where: { id: deviceId },
      data: { lastSynced: new Date() }
    })

    return NextResponse.json({ 
      success: true,
      syncedAt: new Date(),
      records: processedRecords
    })
  } catch (error) {
    console.error("Error in PUT /api/attendance/record:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const studentId = searchParams.get("studentId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 })
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        courseId,
        ...(studentId && { studentId }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error("[ATTENDANCE_RECORD_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
