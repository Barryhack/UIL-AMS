import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // daily, weekly, monthly

    let startDate = new Date()
    let endDate = new Date()

    switch (type) {
      case "daily":
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case "weekly":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "monthly":
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        return new NextResponse("Invalid report type", { status: 400 })
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          select: {
            name: true,
            matricNumber: true,
            department: true,
          },
        },
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Transform data for CSV format
    const csvData = attendanceRecords.map((record) => ({
      Date: record.date.toLocaleDateString(),
      Time: record.date.toLocaleTimeString(),
      "Student Name": record.student.name,
      "Matric Number": record.student.matricNumber,
      Department: record.student.department,
      "Course Code": record.course.code,
      "Course Title": record.course.title,
      Status: record.status,
    }))

    // Convert to CSV string
    const headers = Object.keys(csvData[0])
    const csv = [
      headers.join(","),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(","))
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=attendance-${type}-report-${new Date().toISOString().split("T")[0]}.csv`,
      },
    })
  } catch (error) {
    console.error("[ATTENDANCE_REPORT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 