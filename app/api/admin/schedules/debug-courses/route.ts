import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        faculty: true,
        department: true,
      },
      orderBy: {
        code: "asc"
      }
    })

    return NextResponse.json({
      totalCourses: courses.length,
      courses: courses
    })
  } catch (error: any) {
    console.error("[DEBUG_COURSES]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 