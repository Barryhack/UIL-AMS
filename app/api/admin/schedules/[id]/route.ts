import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateScheduleSchema = z.object({
  courseId: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venue: z.string().min(1),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateScheduleSchema.parse(body)

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!existingSchedule) {
      return new NextResponse("Schedule not found", { status: 404 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    })

    if (!course) {
      return new NextResponse("Course not found", { status: 404 })
    }

    // Check for duplicate schedules (excluding current schedule)
    const duplicateSchedule = await prisma.schedule.findFirst({
      where: {
        courseId: validatedData.courseId,
        day: validatedData.day,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        id: { not: params.id }
      }
    })

    if (duplicateSchedule) {
      return new NextResponse("Duplicate schedule found", { status: 400 })
    }

    // Update the schedule
    const updatedSchedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        courseId: validatedData.courseId,
        day: validatedData.day,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        venue: validatedData.venue,
      },
      include: {
        course: {
          select: {
            code: true,
            title: true,
            lecturer: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: "SCHEDULE_UPDATED",
        details: `Schedule ${params.id} updated for course ${course.code}`,
        userId: session.user.id,
        entity: "Schedule",
      },
    })

    return NextResponse.json(updatedSchedule)
  } catch (error: any) {
    console.error("[SCHEDULE_UPDATE]", error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }
    
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            code: true
          }
        }
      }
    })

    if (!existingSchedule) {
      return new NextResponse("Schedule not found", { status: 404 })
    }

    // Delete the schedule
    await prisma.schedule.delete({
      where: { id: params.id }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        action: "SCHEDULE_DELETED",
        details: `Schedule ${params.id} deleted for course ${existingSchedule.course.code}`,
        userId: session.user.id,
        entity: "Schedule",
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error("[SCHEDULE_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 