import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for updating justification status
const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  comment: z.string().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const justification = await prisma.absenceJustification.findUnique({
      where: {
        id: params.id,
      },
      include: {
        record: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    title: true,
                    lecturer: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            matricNumber: true,
          },
        },
      },
    })

    if (!justification) {
      return NextResponse.json({ success: false, message: "Justification not found" }, { status: 404 })
    }

    // Students can only view their own justifications
    if (session.user.role === "STUDENT" && justification.studentId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Lecturers can only view justifications for their courses
    if (session.user.role === "LECTURER" && justification.record.session.course.lecturer.id !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      justification,
    })
  } catch (error) {
    console.error("Error fetching justification:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch justification" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only lecturers and admins can update justification status
    if (session.user.role === "STUDENT") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const justification = await prisma.absenceJustification.findUnique({
      where: {
        id: params.id,
      },
      include: {
        record: {
          include: {
            session: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    })

    if (!justification) {
      return NextResponse.json({ success: false, message: "Justification not found" }, { status: 404 })
    }

    // Lecturers can only update justifications for their courses
    if (session.user.role === "LECTURER" && justification.record.session.course.lecturerId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validatedData = updateStatusSchema.parse(body)

    // Update the justification
    const updatedJustification = await prisma.absenceJustification.update({
      where: {
        id: params.id,
      },
      data: validatedData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        record: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // If approved, update the attendance record status to EXCUSED
    if (validatedData.status === "APPROVED") {
      await prisma.attendanceRecord.update({
        where: {
          id: justification.recordId,
        },
        data: {
          status: "EXCUSED",
        },
      })
    }

    // Log the justification update
    await prisma.auditLog.create({
      data: {
        action: "JUSTIFICATION_UPDATED",
        details: `Justification ${params.id} updated to ${validatedData.status} by ${session.user.id}`,
        userId: session.user.id,
      },
    })

    // Create notification for the student
    await prisma.notification.create({
      data: {
        title: "Absence Justification Update",
        message: `Your justification for ${updatedJustification.record.session.course.code} has been ${validatedData.status.toLowerCase()}`,
        userId: updatedJustification.student.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Justification ${validatedData.status.toLowerCase()} successfully`,
      justification: updatedJustification,
    })
  } catch (error) {
    console.error("Error updating justification:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to update justification" }, { status: 500 })
  }
}
