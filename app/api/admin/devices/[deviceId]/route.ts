import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { name, location, type, status, ipAddress, macAddress } = data

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: params.deviceId },
      include: { location: true }
    })

    if (!existingDevice) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Update or create location
    let locationId = existingDevice.location.id
    if (location !== existingDevice.location.name) {
      const updatedLocation = await prisma.location.create({
        data: { name: location }
      })
      locationId = updatedLocation.id
    }

    // Update device
    const device = await prisma.device.update({
      where: { id: params.deviceId },
      data: {
        name,
        type,
        status,
        locationId
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
    if (ipAddress !== undefined || macAddress !== undefined) {
      await prisma.$executeRaw`
        UPDATE devices 
        SET ip_address = ${ipAddress || null}, 
            mac_address = ${macAddress || null}
        WHERE id = ${params.deviceId}
      `
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error in PATCH /api/admin/devices/[deviceId]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if device exists and include location
    const device = await prisma.device.findUnique({
      where: { id: params.deviceId },
      include: { location: true }
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Delete the device
    await prisma.device.delete({
      where: { id: params.deviceId }
    })

    // Delete the associated location if no other devices are using it
    const otherDevicesUsingLocation = await prisma.device.count({
      where: { locationId: device.location.id }
    })

    if (otherDevicesUsingLocation === 0) {
      await prisma.location.delete({
        where: { id: device.location.id }
      })
    }

    return NextResponse.json({ message: "Device deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/admin/devices/[deviceId]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
} 