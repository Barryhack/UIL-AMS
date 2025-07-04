import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Session } from "next-auth"

type Role = "ADMIN" | "LECTURER" | "STUDENT"

interface CustomSession extends Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: Role
  }
}

interface AttendanceStat {
  date: Date
  _count: {
    id: number
  }
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions) as CustomSession | null
    
    if (!authSession?.user?.role || authSession.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total counts
    const [
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDevices,
      recentRegistrations,
      totalEnrollments
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "STUDENT" },
      }),
      prisma.user.count({
        where: { role: "LECTURER" },
      }),
      prisma.course.count({
        where: { isArchived: false },
      }),
      prisma.device.count({
        where: { status: "ACTIVE" },
      }),
      prisma.user.findMany({
        where: {
          role: {
            in: ["STUDENT", "LECTURER"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          role: true,
          matricNumber: true,
          department: true,
          createdAt: true,
        },
      }),
      prisma.courseEnrollment.count({
        where: { status: "ENROLLED" },
      })
    ])

    // Get attendance stats for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const attendanceStats = await prisma.attendance.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: "asc",
      },
    })

    // Format attendance stats for the chart
    const formattedStats = attendanceStats.map((stat: AttendanceStat) => ({
      name: stat.date.toLocaleDateString("en-US", { month: "short" }),
      value: (stat._count.id / totalStudents) * 100, // Convert to percentage
    }))

    return NextResponse.json({
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDevices,
      recentRegistrations,
      attendanceStats: formattedStats,
      totalEnrollments,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/dashboard/stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 