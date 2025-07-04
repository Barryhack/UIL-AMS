import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get all schedules with course and lecturer information
    const schedules = await prisma.schedule.findMany({
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { course: { faculty: "asc" } },
        { course: { department: "asc" } },
        { course: { code: "asc" } },
        { day: "asc" },
        { startTime: "asc" }
      ]
    })

    // Create CSV content
    const csvHeaders = [
      "Course Code",
      "Course Title",
      "Faculty",
      "Department",
      "Lecturer",
      "Lecturer Email",
      "Day",
      "Start Time",
      "End Time",
      "Venue"
    ]

    const csvRows = schedules.map(schedule => [
      schedule.course.code,
      schedule.course.title,
      schedule.course.faculty,
      schedule.course.department,
      schedule.course.lecturer.name,
      schedule.course.lecturer.email,
      schedule.day,
      schedule.startTime,
      schedule.endTime,
      schedule.venue
    ])

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n")

    // Create response with CSV headers
    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv")
    response.headers.set("Content-Disposition", `attachment; filename="schedules-${new Date().toISOString().split('T')[0]}.csv"`)

    return response
  } catch (error: any) {
    console.error("[SCHEDULE_EXPORT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 