import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Schema for validating registration data
const registrationSchema = z.object({
  userId: z.string(),
  fingerprintId: z.string(),
  rfidUid: z.string(),
  deviceId: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate request body
    const validatedData = registrationSchema.parse(body)

    // Update user with biometric data
    const updatedUser = await prisma.user.update({
      where: {
        id: validatedData.userId,
      },
      data: {
        fingerprintId: validatedData.fingerprintId,
        rfidUid: validatedData.rfidUid,
      },
    })

    // Log the registration in audit log
    await prisma.auditLog.create({
      data: {
        action: "DEVICE_REGISTERED",
        details: `Device ${updatedUser.name} registered`,
        userId: updatedUser.id,
        entity: "Device",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Biometric data registered successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to register biometric data" }, { status: 500 })
  }
}
