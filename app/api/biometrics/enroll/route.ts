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
        
        // Check if this RFID UID is already registered to another user
        const existingUser = await prisma.user.findFirst({
          where: {
            rfidUid: rfidUid,
            id: { not: userId } // Exclude the current user
          },
          select: { id: true, name: true, email: true }
        })
        
        if (existingUser) {
          return NextResponse.json({ 
            error: "RFID card is already registered to another user", 
            details: {
              existingUser: {
                name: existingUser.name,
                email: existingUser.email
              }
            }
          }, { status: 409 })
        }
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
      details: `Biometric enrollment completed for user ${userId}`,
      userId,
      entity: "USER",
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error: any) {
    console.error("Error enrolling biometrics:", error)
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('rfidUid')) {
      return NextResponse.json({ 
        error: "RFID card is already registered to another user",
        details: "This RFID card has already been assigned to a different user"
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Failed to enroll biometrics" }, { status: 500 })
  }
}
