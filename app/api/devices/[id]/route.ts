import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// GET /api/devices/[id] - Get a single device
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const device = await prisma.device.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            attendanceRecords: true,
          },
        },
      },
    })

    if (!device) {
      return NextResponse.json({ message: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch device" },
      { status: 500 }
    )
  }
}

// PATCH /api/devices/[id] - Update a device
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update devices
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const device = await prisma.device.update({
      where: { id: params.id },
      data: {
        name: body.name,
        type: body.type,
        location: body.location,
        status: body.status,
        serialNumber: body.serialNumber,
      },
    })

    // Log device update
    await prisma.auditLog.create({
      data: {
        action: "DEVICE_UPDATED",
        entity: device.id,
        userId: session.user.id,
        details: `Updated device ${device.name}`,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update device" },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[id] - Delete a device
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete devices
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id: params.id },
    })

    if (!device) {
      return NextResponse.json({ message: "Device not found" }, { status: 404 })
    }

    // Manually delete all related records before deleting the device
    await prisma.attendanceRecord.deleteMany({ where: { deviceId: params.id } })
    await prisma.deviceCommand.deleteMany({ where: { deviceId: device.deviceId } })
    await prisma.deviceStatus.deleteMany({ where: { deviceId: device.deviceId } })
    await prisma.courseDevice.deleteMany({ where: { deviceId: params.id } })
    // Add more deletions here if you have other relations

    // Delete the device
    await prisma.device.delete({
      where: { id: params.id },
    })

    // Log device deletion
    await prisma.auditLog.create({
      data: {
        action: "DEVICE_DELETED",
        entity: params.id,
        userId: session.user.id,
        details: `Deleted device ${device.name}`,
      },
    })

    return NextResponse.json({ message: "Device deleted successfully" })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete device" },
      { status: 500 }
    )
  }
} 