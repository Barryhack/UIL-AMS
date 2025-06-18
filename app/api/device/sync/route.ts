import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Schema for validating sync data
const syncSchema = z.object({
  deviceId: z.string(),
  records: z.array(
    z.object({
      sessionId: z.string(),
      studentId: z.string(),
      verificationMethod: z.enum(["FINGERPRINT", "RFID"]),
      timestamp: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate request body
    const validatedData = syncSchema.parse(body)

    // Update device last seen timestamp
    await prisma.deviceRegistration.update({
      where: {
        deviceId: validatedData.deviceId,
      },
      data: {
        lastSeen: new Date(),
      },
    })

    // Process each attendance record
    const results = await Promise.all(
      validatedData.records.map(async (record) => {
        try {
          // Check if record already exists to avoid duplicates
          const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
              sessionId: record.sessionId,
              studentId: record.studentId,
              timestamp: new Date(record.timestamp),
            },
          })

          if (existingRecord) {
            return {
              success: true,
              message: "Record already exists",
              recordId: existingRecord.id,
            }
          }

          // Create new attendance record
          const newRecord = await prisma.attendanceRecord.create({
            data: {
              sessionId: record.sessionId,
              studentId: record.studentId,
              verificationMethod: record.verificationMethod,
              deviceId: validatedData.deviceId,
              timestamp: new Date(record.timestamp),
              status: record.status || "PRESENT",
            },
          })

          return {
            success: true,
            message: "Record created",
            recordId: newRecord.id,
          }
        } catch (error) {
          console.error("Error processing record:", error)
          return {
            success: false,
            message: "Failed to process record",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    // Log the sync in audit log
    await prisma.auditLog.create({
      data: {
        action: "DEVICE_SYNC",
        details: `Device ${validatedData.deviceId} synced ${validatedData.records.length} records`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Synced ${results.filter((r) => r.success).length} of ${results.length} records`,
      results,
    })
  } catch (error) {
    console.error("Sync error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to sync attendance records" }, { status: 500 })
  }
}
