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

    // Get attendance stats for the last 6 months, grouped by month
    const attendanceStats = await prisma.$queryRaw`
      SELECT
        to_char(date, 'Mon YYYY') as month,
        COUNT(id) as count
      FROM "Attendance"
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY MIN(date)
    ` as any[];

    const formattedStats = attendanceStats.map((stat: any) => ({
      name: stat.month,
      value: (Number(stat.count) / totalStudents) * 100,
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