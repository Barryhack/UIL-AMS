import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const assignmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  lecturerId: z.string().min(1, "Lecturer ID is required"),
})

export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions)
    
    if (!authSession?.user?.role || authSession.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    try {
      // Validate request body
      const { courseId, lecturerId } = assignmentSchema.parse(body)

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lecturer: true,
          enrollments: true,
        }
      })

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }

      // Check if lecturer exists and is actually a lecturer
      const lecturer = await prisma.user.findFirst({
        where: { 
          id: lecturerId,
          role: "LECTURER"
        },
      })

      if (!lecturer) {
        return NextResponse.json(
          { error: "Lecturer not found or is not a lecturer" },
          { status: 404 }
        )
      }

      // Update course with new lecturer
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { lecturerId },
        include: {
          lecturer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
      })

      await prisma.auditLog.create({
        data: {
          action: "COURSE_ASSIGNED",
          details: `Course ${course.title} assigned to lecturer ${lecturer.name}`,
          userId: authSession.user.id,
          entity: "Course",
        },
      });

      return NextResponse.json({ 
        success: true,
        course: updatedCourse
      })
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
    console.error("Error in POST /api/admin/courses/assign:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 