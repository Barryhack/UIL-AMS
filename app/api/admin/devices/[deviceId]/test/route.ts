import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Session } from "next-auth"

interface CustomSession extends Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: string
  }
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

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      return new NextResponse("Device not found", { status: 404 })
    }

    // TODO: Implement actual device test logic here
    // This would involve:
    // 1. Connecting to the physical device
    // 2. Testing basic functionality (power, network, etc.)
    // 3. Testing specific features (fingerprint scanner, RFID reader)
    // 4. Running diagnostics

    // For now, just update the lastTest timestamp and status
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastTest: new Date(),
        status: "ACTIVE", // Assuming test passed
        isOnline: true,
      },
    })

    return NextResponse.json(updatedDevice)
  } catch (error) {
    console.error("Error in POST /api/admin/devices/[deviceId]/test:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 