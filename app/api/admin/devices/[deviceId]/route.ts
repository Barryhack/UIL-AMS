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
    const { name, location, type, status, ipAddress, macAddress, courseIds } = data

    const updatedDevice = await prisma.$transaction(async (tx) => {
      // 1. Find or create the location to get its ID
      let locationRecord = await tx.location.findFirst({
        where: { name: location },
      });
      if (!locationRecord) {
        locationRecord = await tx.location.create({
          data: { name: location },
        });
      }

      // 2. Update course assignments
      if (courseIds && Array.isArray(courseIds)) {
        // First, remove all existing assignments for this device
        await tx.courseDevice.deleteMany({
          where: { deviceId: params.deviceId },
        });

        // Then, create the new assignments
        if (courseIds.length > 0) {
          await tx.courseDevice.createMany({
            data: courseIds.map((courseId: string) => ({
              deviceId: params.deviceId,
              courseId: courseId,
            })),
          });
        }
      }
      
      // 3. Update device details, now with the correct locationId
      const device = await tx.device.update({
        where: { id: params.deviceId },
        data: {
          name,
          locationId: locationRecord.id,
          type,
          status,
          ipAddress,
          macAddress,
        },
        include: {
          location: true,
          _count: {
            select: {
              attendanceRecords: true
            }
          }
        }
      });
      return device;
    });

    return NextResponse.json(updatedDevice)
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