import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        course: {
          lecturerId: session.user.id
        }
      },
      include: {
        student: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            code: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    })

    return NextResponse.json(recentAttendance)
  } catch (error) {
    console.error("Error fetching recent attendance:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 