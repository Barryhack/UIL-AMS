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
    const type = searchParams.get("type") // users, devices, performance

    let data: any[] = []
    let filename = ""

    switch (type) {
      case "users":
        data = await prisma.user.findMany({
          select: {
            name: true,
            email: true,
            role: true,
            matricNumber: true,
            staffId: true,
            department: true,
            faculty: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
        filename = "user-activity"
        break

      case "devices":
        data = await prisma.device.findMany({
          include: {
            location: true,
            _count: {
              select: {
                attendanceRecords: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
        // Transform device data
        data = data.map(device => ({
          Name: device.name,
          "Serial Number": device.serialNumber,
          Location: device.location.name,
          Status: device.status,
          "Total Records": device._count.attendanceRecords,
          "Created At": device.createdAt.toLocaleDateString(),
        }))
        filename = "device-status"
        break

      case "performance":
        // Get system performance metrics
        const totalUsers = await prisma.user.count()
        const totalDevices = await prisma.device.count()
        const totalAttendance = await prisma.attendance.count()
        const totalCourses = await prisma.course.count()

        // Get attendance by status
        const attendanceByStatus = await prisma.attendance.groupBy({
          by: ["status"],
          _count: true,
        })

        data = [{
          "Total Users": totalUsers,
          "Total Devices": totalDevices,
          "Total Attendance Records": totalAttendance,
          "Total Courses": totalCourses,
          "Present Count": attendanceByStatus.find(a => a.status === "PRESENT")?._count || 0,
          "Absent Count": attendanceByStatus.find(a => a.status === "ABSENT")?._count || 0,
          "Report Generated": new Date().toLocaleString(),
        }]
        filename = "system-performance"
        break

      default:
        return new NextResponse("Invalid report type", { status: 400 })
    }

    // Convert to CSV string
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(","))
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${filename}-report-${new Date().toISOString().split("T")[0]}.csv`,
      },
    })
  } catch (error) {
    console.error("[SYSTEM_REPORT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 