import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// Schema for course creation
const courseSchema = z.object({
  code: z.string()
    .regex(/^[A-Z]{3}\d{3}$/, "Course code must be in format 'ABC123'"),
  title: z.string()
    .min(5, "Course title must be at least 5 characters")
    .max(100, "Course title must not exceed 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must not exceed 500 characters"),
  units: z.number().int().min(1).max(6),
  level: z.string(),
  semester: z.enum(["FIRST", "SECOND"]),
  academicYear: z.string(),
  faculty: z.string(),
  department: z.string(),
  maxCapacity: z.number().int().min(1),
  lecturerId: z.string()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    try {
      const validatedData = courseSchema.parse(body)
      
      // Check if course code already exists
      const existingCourse = await prisma.course.findUnique({
        where: {
          code: validatedData.code,
        },
      })

      if (existingCourse) {
        return NextResponse.json(
          { error: "Course with this code already exists" },
          { status: 400 }
        )
      }

      // Create course
      const course = await prisma.course.create({
        data: validatedData,
        include: {
          lecturer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          action: "COURSE_CREATED",
          details: `Course ${course.title} created`,
          userId: session.user.id,
          entity: "Course",
        },
      });

      return NextResponse.json({ course })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: validationError.errors[0].message },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error("[COURSES_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const faculty = searchParams.get("faculty")
    const department = searchParams.get("department")
    const query = searchParams.get("query")

    const courses = await prisma.course.findMany({
      where: {
        AND: [
          faculty ? { faculty } : {},
          department ? { department } : {},
          query
            ? {
                OR: [
                  { code: { contains: query } },
                  { title: { contains: query } },
                  { description: { contains: query } },
                ],
              }
            : {},
          session.user.role === "LECTURER"
            ? { lecturerId: session.user.id }
            : session.user.role === "STUDENT"
            ? {
                enrollments: {
                  some: {
                    studentId: session.user.id,
                  },
                },
              }
            : {},
        ],
      },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        schedules: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error("[COURSES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
