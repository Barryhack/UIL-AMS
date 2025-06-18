import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for biometric registration
const biometricSchema = z.object({
  userId: z.string(),
  fingerprintId: z.string().optional(),
  rfidUid: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can register biometrics for other users
    // Users can register their own biometrics
    const body = await req.json()
    const { userId } = body

    if (session.user.id !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Validate request body
    const validatedData = biometricSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: validatedData.userId,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Update user with biometric data
    const dataToUpdate: { fingerprintId?: string; rfidUid?: string } = {}

    if (validatedData.fingerprintId) {
      // Check if fingerprint ID is already registered to another user
      const existingFingerprint = await prisma.user.findFirst({
        where: {
          fingerprintId: validatedData.fingerprintId,
          NOT: {
            id: validatedData.userId,
          },
        },
      })

      if (existingFingerprint) {
        return NextResponse.json(
          { success: false, message: "Fingerprint ID is already registered to another user" },
          { status: 400 },
        )
      }

      dataToUpdate.fingerprintId = validatedData.fingerprintId
    }

    if (validatedData.rfidUid) {
      // Check if RFID UID is already registered to another user
      const existingRfid = await prisma.user.findFirst({
        where: {
          rfidUid: validatedData.rfidUid,
          NOT: {
            id: validatedData.userId,
          },
        },
      })

      if (existingRfid) {
        return NextResponse.json(
          { success: false, message: "RFID UID is already registered to another user" },
          { status: 400 },
        )
      }

      dataToUpdate.rfidUid = validatedData.rfidUid
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: {
        id: validatedData.userId,
      },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        fingerprintId: true,
        rfidUid: true,
      },
    })

    // Log the biometric registration
    await prisma.auditLog.create({
      data: {
        action: "BIOMETRIC_REGISTERED",
        details: `Biometric data registered for user ${updatedUser.id} by ${session.user.id}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Biometric data registered successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error registering biometric data:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to register biometric data" }, { status: 500 })
  }
}
