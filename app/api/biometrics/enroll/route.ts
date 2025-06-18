import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { processFingerprint, processRfid } from "@/lib/biometrics"
import { createAuditLog } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const { userId, fingerprintData, rfidData } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Process biometric data
    let fingerprintId = null
    let rfidUid = null

    if (fingerprintData) {
      const result = await processFingerprint(fingerprintData)
      if (result.success) {
        fingerprintId = result.fingerprintId
      }
    }

    if (rfidData) {
      const result = await processRfid(rfidData)
      if (result.success) {
        rfidUid = result.rfidUid
      }
    }

    if (!fingerprintId && !rfidUid) {
      return NextResponse.json({ error: "No biometric data provided" }, { status: 400 })
    }

    // Update user with biometric data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (fingerprintId) {
      updateData.fingerprintId = fingerprintId
    }

    if (rfidUid) {
      updateData.rfidUid = rfidUid
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        fingerprintId: true,
        rfidUid: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create audit log
    await createAuditLog({
      action: "BIOMETRIC_ENROLLMENT",
      details: `Biometric data enrolled for user ${userId}`,
      userId,
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Error enrolling biometrics:", error)
    return NextResponse.json({ error: "Failed to enroll biometrics" }, { status: 500 })
  }
}
