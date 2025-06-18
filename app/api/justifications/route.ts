import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const justificationSchema = z.object({
  attendanceId: z.string(),
  reason: z.string().min(10),
  supportingDocument: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = justificationSchema.parse(body)

    // Check if the attendance record exists and belongs to the student
    const attendance = await prisma.attendance.findUnique({
      where: {
        id: validatedData.attendanceId,
        studentId: session.user.id,
      },
    })

    if (!attendance) {
      return new NextResponse("Attendance record not found", { status: 404 })
    }

    // Create justification
    const justification = await prisma.justification.create({
      data: {
        attendanceId: validatedData.attendanceId,
        reason: validatedData.reason,
        supportingDocument: validatedData.supportingDocument,
        status: "PENDING",
      },
    })

    return NextResponse.json(justification)
  } catch (error: any) {
    console.error("[JUSTIFICATIONS_POST]", error)
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const courseId = searchParams.get("courseId")

    const justifications = await prisma.justification.findMany({
      where: {
        ...(status && { status }),
        attendance: {
          ...(courseId && { courseId }),
          ...(session.user.role === "STUDENT" && { studentId: session.user.id }),
          ...(session.user.role === "LECTURER" && { course: { lecturerId: session.user.id } }),
        },
      },
      include: {
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
              },
            },
            course: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(justifications)
  } catch (error: any) {
    console.error("[JUSTIFICATIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "LECTURER") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { id, status, comment } = body

    if (!id || !status) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if the justification exists and belongs to a course taught by the lecturer
    const justification = await prisma.justification.findFirst({
      where: {
        id,
        attendance: {
          course: {
            lecturerId: session.user.id,
          },
        },
      },
    })

    if (!justification) {
      return new NextResponse("Justification not found", { status: 404 })
    }

    // Update justification
    const updatedJustification = await prisma.justification.update({
      where: {
        id,
      },
      data: {
        status,
        comment,
      },
      include: {
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
              },
            },
            course: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedJustification)
  } catch (error: any) {
    console.error("[JUSTIFICATIONS_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
