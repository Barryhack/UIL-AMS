import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { name, location, type, ipAddress, macAddress, serialNumber, deviceId } = data

    // Create location first
    const newLocation = await prisma.location.create({
      data: { name: location }
    })

    // Create device with location
    const device = await prisma.device.create({
      data: {
        name,
        type,
        serialNumber,
        status: "ACTIVE",
        mode: "ONLINE",
        deviceId,
        location: {
          connect: {
            id: newLocation.id
          }
        }
      },
      include: {
        location: true,
        _count: {
          select: {
            attendanceRecords: true
          }
        }
      }
    })

    // If network fields are provided, update them
    if (ipAddress || macAddress) {
      await prisma.$executeRaw`
        UPDATE "Device" 
        SET ip_address = ${ipAddress || null}, 
            mac_address = ${macAddress || null}
        WHERE id = ${device.id}
      `
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error in POST /api/admin/devices:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const devices = await prisma.device.findMany({
      include: {
        location: true,
        assignedCourses: true,
        _count: {
          select: {
            attendanceRecords: true
          }
        }
      }
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error in GET /api/admin/devices:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
} 