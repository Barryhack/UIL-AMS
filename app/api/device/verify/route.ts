import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const { deviceId, fingerprintId, rfidUid } = await req.json()

    if (!deviceId || (!fingerprintId && !rfidUid)) {
      return NextResponse.json(
        { error: "Device ID and biometric data required" },
        { status: 400 }
      )
    }

    // Find user by biometric data
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { fingerprintId: fingerprintId || undefined },
          { rfidUid: rfidUid || undefined },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "No user found with provided biometric data" },
        { status: 404 }
      )
    }

    // Create verification record
    const verification = await prisma.deviceVerification.create({
      data: {
        deviceId,
        userId: user.id,
        verificationMethod: fingerprintId ? "FINGERPRINT" : "RFID",
        timestamp: new Date(),
      },
    })

    // Create audit log
    await createAuditLog({
      action: "DEVICE_VERIFICATION",
      details: `Device verification completed for user ${user.id}`,
      userId: user.id,
      entity: "USER",
    })

    return NextResponse.json({
      success: true,
      verification,
      user: {
        id: user.id,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Error verifying device:", error)
    return NextResponse.json(
      { error: "Failed to verify device" },
      { status: 500 }
    )
  }
}
