import prisma from "./prisma"
import { createHash } from "crypto"

interface HardwareAuthResult {
  success: boolean
  device?: any
  error?: string
}

export async function verifyHardwareAuth(request: Request): Promise<HardwareAuthResult> {
  try {
    const apiKey = request.headers.get("x-api-key")
    const deviceId = request.headers.get("x-device-id")
    const macAddress = request.headers.get("x-mac-address")

    if (!apiKey || !deviceId || !macAddress) {
      return { success: false, error: "Missing authentication headers" }
    }

    // Verify API key (you should use a more secure method in production)
    const expectedApiKey = process.env.HARDWARE_API_KEY
    if (apiKey !== expectedApiKey) {
      return { success: false, error: "Invalid API key" }
    }

    // Find the device in the database
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        macAddress,
        status: "ACTIVE",
      },
    })

    if (!device) {
      return { success: false, error: "Device not found or inactive" }
    }

    // Update device status
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSync: new Date(),
        isOnline: true,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      },
    })

    return { success: true, device }
  } catch (error) {
    console.error("Hardware authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export function generateDeviceHash(macAddress: string): string {
  return createHash("sha256").update(macAddress + process.env.HARDWARE_SECRET).digest("hex")
} 