import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    const { code, title, description, department, faculty, semester, academicYear, lecturerId, level = "500" } = data

    // Check if course already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    })

    if (existingCourse) {
      return new NextResponse("Course already exists", { status: 400 })
    }

    // Check if lecturer exists and is actually a lecturer
    if (lecturerId) {
      const lecturer = await prisma.user.findFirst({
        where: { 
          id: lecturerId,
          role: "LECTURER"
        },
      })

      if (!lecturer) {
        return new NextResponse("Invalid lecturer ID", { status: 400 })
      }
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        code,
        title,
        description,
        department,
        faculty,
        semester,
        academicYear,
        lecturerId,
        level,
        units: 3,
        maxCapacity: 60,
      },
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

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error in POST /api/admin/courses:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const department = searchParams.get("department")
    const faculty = searchParams.get("faculty")
    const semester = searchParams.get("semester")
    const academicYear = searchParams.get("academicYear")
    const query = searchParams.get("query")

    const where = {
      ...(department && { department }),
      ...(faculty && { faculty }),
      ...(semester && { semester }),
      ...(academicYear && { academicYear }),
      ...(query && {
        OR: [
          { code: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
        ],
      }),
      isArchived: false,
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error in GET /api/admin/courses:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 