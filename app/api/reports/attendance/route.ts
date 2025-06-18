import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!courseId || !startDate || !endDate) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    // Check if user has access to the course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { lecturerId: session.user.id },
          {
            enrollments: {
              some: {
                studentId: session.user.id,
              },
            },
          },
        ],
      },
    })

    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 })
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
          },
        },
        justification: {
          select: {
            id: true,
            reason: true,
            status: true,
            comment: true,
          },
        },
      },
      orderBy: [
        {
          date: "asc",
        },
        {
          student: {
            name: "asc",
          },
        },
      ],
    })

    // Calculate statistics
    const totalClasses = await prisma.attendance.groupBy({
      by: ["date"],
      where: {
        courseId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    })

    const stats = {
      totalClasses: totalClasses.length,
      records: attendanceRecords,
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("[ATTENDANCE_REPORTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
