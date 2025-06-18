import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { deviceId, userId, type } = body

    if (!deviceId || !userId || !type) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify device exists and is active
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
        status: "ACTIVE",
      },
    })

    if (!device) {
      return new NextResponse("Device not found or inactive", { status: 404 })
    }

    // Record attendance
    const record = await prisma.attendanceRecord.create({
      data: {
        deviceId,
        userId,
        type,
      },
    })

    return NextResponse.json(record)
  } catch (error: any) {
    console.error("[DEVICE_RECORD_ATTENDANCE_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get("deviceId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!deviceId) {
      return new NextResponse("Device ID is required", { status: 400 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        deviceId,
        ...(userId && { userId }),
        ...(startDate && endDate && {
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    return NextResponse.json(records)
  } catch (error: any) {
    console.error("[DEVICE_RECORD_ATTENDANCE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
