import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/devices/[id]/attendance - Get device attendance records
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const page = parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    const records = await prisma.attendanceRecord.findMany({
      where: { deviceId: params.id },
      include: {
        user: {
          select: {
            name: true,
            matricNumber: true,
          },
        },
        session: {
          include: {
            course: {
              select: {
                code: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip,
    })

    const total = await prisma.attendanceRecord.count({
      where: { deviceId: params.id },
    })

    return NextResponse.json({
      records,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    )
  }
} 