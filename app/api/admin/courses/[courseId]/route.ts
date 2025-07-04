import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Validation schema for course updates
const courseUpdateSchema = z.object({
  code: z.string().min(2, "Course code must be at least 2 characters"),
  title: z.string().min(2, "Course title must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  faculty: z.string().min(2, "Faculty must be at least 2 characters"),
  department: z.string().min(2, "Department must be at least 2 characters"),
  semester: z.enum(["FIRST", "SECOND"]),
  academicYear: z.string().min(4, "Academic year must be at least 4 characters"),
  units: z.number().min(1).max(6),
  level: z.enum(["100", "200", "300", "400", "500"]),
  maxCapacity: z.number().min(1),
  lecturerId: z.string().min(1, "Lecturer ID is required"),
})

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error in GET /api/admin/courses/[courseId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    try {
      // Validate request body
      const validatedData = courseUpdateSchema.parse(body)

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id: params.courseId }
      })

      if (!existingCourse) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }

      // Check if lecturer exists
      const lecturer = await prisma.user.findFirst({
        where: { 
          id: validatedData.lecturerId,
          role: "LECTURER"
        }
      })

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found" },
          { status: 404 }
        )
      }

      // Update course
      const updatedCourse = await prisma.course.update({
        where: { id: params.courseId },
        data: validatedData,
        include: {
          lecturer: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })

      await prisma.auditLog.create({
        data: {
          action: "COURSE_UPDATED",
          details: `Course ${updatedCourse.title} updated`,
          userId: session.user.id,
          entity: "Course",
        },
      });

      return NextResponse.json(updatedCourse)
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
    console.error("Error in PATCH /api/admin/courses/[courseId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 