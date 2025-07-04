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

    const {
      sessionId,
      userId,
      verificationMethod,
      fingerprintId,
      rfidTagId,
      latitude,
      longitude,
    } = await request.json()

    // Validate required fields
    if (!sessionId || !userId || !verificationMethod) {
      return NextResponse.json(
        { error: "Missing required verification data" },
        { status: 400 }
      )
    }

    // Start a transaction for attendance verification
    const result = await prisma.$transaction(async (tx) => {
      // Get current session
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          course: true,
        },
      })

      if (!session) {
        throw new Error("Session not found")
      }

      // Check if session is active
      if (session.status !== "IN_PROGRESS") {
        throw new Error("Session is not active")
      }

      // Verify user enrollment
      const enrollment = await tx.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: session.courseId,
          },
        },
      })

      if (!enrollment) {
        throw new Error("User not enrolled in this course")
      }

      // Verify authentication method based on session requirements
      if (session.requiresFingerprint && verificationMethod === "FINGERPRINT") {
        const biometric = await tx.biometricData.findUnique({
          where: { userId },
        })

        if (!biometric || biometric.templateId !== fingerprintId) {
          throw new Error("Invalid fingerprint")
        }
      }

      if (session.requiresRFID && verificationMethod === "RFID") {
        const rfid = await tx.rFIDTag.findUnique({
          where: { userId },
        })

        if (!rfid || rfid.tagId !== rfidTagId || !rfid.isActive) {
          throw new Error("Invalid RFID tag")
        }
      }

      // Calculate attendance status
      const now = new Date()
      const lateThreshold = 15 // 15 minutes grace period
      const isLate =
        now.getTime() - session.startTime.getTime() > lateThreshold * 60 * 1000

      // Record attendance
      const attendance = await tx.attendanceRecord.create({
        data: {
          sessionId,
          deviceId: authResult.device.id,
          studentId: userId,
          type: "IN",
          status: isLate ? "LATE" : "PRESENT",
          verificationMethod,
          timestamp: now,
          syncedAt: now,
          metadata: JSON.stringify({ latitude, longitude }),
        },
      })

      // Update biometric/RFID last used timestamp
      if (verificationMethod === "FINGERPRINT") {
        await tx.biometricData.update({
          where: { userId },
          data: {
            verifiedAt: now,
            failedScans: 0,
          },
        })
      } else if (verificationMethod === "RFID") {
        await tx.rFIDTag.update({
          where: { userId },
          data: {
            lastUsed: now,
          },
        })
      }

      // Log the attendance event
      await tx.auditLog.create({
        data: {
          action: "ATTENDANCE_MARKED",
          entity: "ATTENDANCE_RECORD",
          userId,
          details: `Attendance marked via ${verificationMethod} for ${session.course.code}`,
        },
      })

      await tx.auditLog.create({
        data: {
          action: "HARDWARE_VERIFIED",
          details: `Hardware verified for user ${userId}`,
          userId,
          entity: "User",
        },
      })

      return {
        success: true,
        attendance: {
          ...attendance,
          course: session.course.code,
        },
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify attendance" },
      { status: 400 }
    )
  }
} 