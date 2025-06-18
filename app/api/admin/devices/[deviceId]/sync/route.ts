import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Session } from "next-auth"
import { broadcastToDevices } from "@/lib/websocket"

interface CustomSession extends Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: string
  }
}

interface OfflineRecord {
  sessionId: string
  studentId: string
  timestamp: number
  verificationMethod: 'FINGERPRINT' | 'RFID'
}

export async function POST(
  req: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const authSession = await getServerSession(authOptions) as CustomSession | null
    
    if (!authSession?.user?.role || authSession.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { deviceId } = params
    const data = await req.json()
    const { offlineRecords, deviceStatus } = data

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      return new NextResponse("Device not found", { status: 404 })
    }

    // Process offline attendance records if any
    if (offlineRecords && Array.isArray(offlineRecords)) {
      for (const record of offlineRecords as OfflineRecord[]) {
        const { sessionId, studentId, timestamp, verificationMethod } = record

        // Create attendance record
        await prisma.attendance.create({
          data: {
            sessionId,
            studentId,
            deviceId,
            status: 'PRESENT',
            date: new Date(timestamp),
            time: new Date(timestamp),
            verificationMethod,
            isOfflineRecord: true,
            syncedAt: new Date(),
          },
        })
      }

      // Log the sync
      await prisma.auditLog.create({
        data: {
          action: 'OFFLINE_RECORDS_SYNCED',
          entity: 'DEVICE',
          entityId: deviceId,
          details: JSON.stringify({
            recordCount: offlineRecords.length,
            syncTime: new Date(),
          }),
        },
      })
    }

    // Update device status
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSync: new Date(),
        isOnline: true,
        status: deviceStatus?.status || 'ACTIVE',
        batteryLevel: deviceStatus?.batteryLevel,
        sdCardSpace: deviceStatus?.sdCardSpace,
        firmwareVersion: deviceStatus?.firmwareVersion,
      },
    })

    // Broadcast device status update to connected clients
    broadcastToDevices({
      type: 'DEVICE_STATUS_UPDATE',
      deviceId,
      status: updatedDevice.status,
      lastSync: updatedDevice.lastSync,
    })

    return NextResponse.json(updatedDevice)
  } catch (error) {
    console.error("Error in POST /api/admin/devices/[deviceId]/sync:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 