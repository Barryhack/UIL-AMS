import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyHardwareAuth } from "@/lib/hardware-auth"

export async function POST(request: Request) {
  try {
    // Verify hardware authentication
    const authResult = await verifyHardwareAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized device" }, { status: 401 })
    }

    const { userId, fingerprintData, fingerprintId, rfidTagId, deviceId } = await request.json()

    // Validate required fields
    if (!userId || !deviceId || (!fingerprintData && !rfidTagId)) {
      return NextResponse.json(
        { error: "Missing required registration data" },
        { status: 400 }
      )
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user's registration status
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          registrationStatus: "PENDING",
          deviceId,
        },
      })

      // Handle fingerprint registration if provided
      if (fingerprintData && fingerprintId) {
        await tx.biometricData.upsert({
          where: { userId },
          create: {
            userId,
            templateData: fingerprintData,
            templateId: fingerprintId,
            status: "ACTIVE",
          },
          update: {
            templateData: fingerprintData,
            templateId: fingerprintId,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        })
      }

      // Handle RFID registration if provided
      if (rfidTagId) {
        await tx.rFIDTag.upsert({
          where: { userId },
          create: {
            userId,
            tagId: rfidTagId,
            isActive: true,
          },
          update: {
            tagId: rfidTagId,
            isActive: true,
            updatedAt: new Date(),
          },
        })
      }

      // Update user registration status to completed
      await tx.user.update({
        where: { id: userId },
        data: {
          registrationStatus: "COMPLETED",
        },
      })

      // Log the registration event
      await tx.auditLog.create({
        data: {
          action: "USER_REGISTRATION",
          entity: "User",
          entityId: userId,
          details: `Registered with ${fingerprintData ? "fingerprint" : ""} ${
            rfidTagId ? "and RFID" : ""
          }`,
          severity: "INFO",
        },
      })

      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Failed to process registration" },
      { status: 500 }
    )
  }
} 