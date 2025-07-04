import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const scheduleSchema = z.object({
  courseId: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  venue: z.string().min(1),
})

const bulkImportSchema = z.object({
  schedules: z.array(scheduleSchema),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = bulkImportSchema.parse(body)

    let imported = 0
    let errors: string[] = []

    // Process schedules in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < validatedData.schedules.length; i += batchSize) {
      const batch = validatedData.schedules.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (schedule) => {
          try {
            // Check if course exists
            const course = await prisma.course.findUnique({
              where: { id: schedule.courseId }
            })

            if (!course) {
              errors.push(`Course not found: ${schedule.courseId}`)
              return
            }

            // Check for duplicate schedules
            const existingSchedule = await prisma.schedule.findFirst({
              where: {
                courseId: schedule.courseId,
                day: schedule.day,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              }
            })

            if (existingSchedule) {
              errors.push(`Duplicate schedule found for ${course.code} on ${schedule.day}`)
              return
            }

            // Create the schedule
            await prisma.schedule.create({
              data: {
                courseId: schedule.courseId,
                day: schedule.day,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                venue: schedule.venue,
              }
            })

            imported++
          } catch (error) {
            console.error("Error importing schedule:", error)
            errors.push(`Failed to import schedule: ${error}`)
          }
        })
      )
    }

    // Log the bulk import
    await prisma.auditLog.create({
      data: {
        action: "BULK_SCHEDULE_IMPORT",
        details: `Imported ${imported} schedules with ${errors.length} errors`,
        userId: session.user.id,
        entity: "Schedule",
      },
    })

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("[BULK_SCHEDULE_IMPORT]", error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }
    
    return new NextResponse("Internal error", { status: 500 })
  }
} 