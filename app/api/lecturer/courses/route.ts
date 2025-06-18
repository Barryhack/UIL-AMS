import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const courses = await prisma.course.findMany({
      where: {
        lecturerId: session.user.id
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            attendances: true
          }
        }
      }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 