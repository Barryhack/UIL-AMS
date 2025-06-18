import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const sessionSchema = z.object({
  courseId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "LECTURER") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const validatedData = sessionSchema.parse(body)

    // Check if the lecturer teaches this course
    const course = await prisma.course.findFirst({
      where: {
        id: validatedData.courseId,
        lecturerId: session.user.id,
      },
    })

    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 })
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        courseId: validatedData.courseId,
        day: new Date(validatedData.date).toLocaleDateString("en-US", { weekday: "long" }),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        venue: validatedData.venue,
      },
    })

    return NextResponse.json(schedule)
  } catch (error: any) {
    console.error("[SESSIONS_POST]", error)
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
    const courseId = searchParams.get("courseId")
    const date = searchParams.get("date")

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 })
    }

    // Check if user has access to the course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { lecturerId: session.user.id },
          {
            enrollments: {
              some: {
                studentId: session.user.id,
              },
            },
          },
        ],
      },
    })

    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 })
    }

    // Get schedules
    const schedules = await prisma.schedule.findMany({
      where: {
      courseId,
        ...(date && {
          day: new Date(date).toLocaleDateString("en-US", { weekday: "long" }),
        }),
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(schedules)
  } catch (error: any) {
    console.error("[SESSIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
