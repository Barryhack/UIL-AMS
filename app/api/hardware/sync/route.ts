import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Get all courses with enrollments
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                fingerprintId: true,
                rfidUid: true,
              }
            }
          }
        }
      }
    })

    // Get all users with biometric data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        fingerprintId: true,
        rfidUid: true,
      }
    })

    // Format data for hardware sync
    const syncData = {
      courses: courses.map(course => ({
        id: course.id,
        code: course.code,
        title: course.title,
        enrollments: course.enrollments.map(enrollment => ({
          courseId: course.id,
          studentId: enrollment.student.id,
          status: enrollment.status,
          student: {
            id: enrollment.student.id,
            name: enrollment.student.name,
            email: enrollment.student.email,
            role: enrollment.student.role,
            fingerprintId: enrollment.student.fingerprintId,
            rfidUid: enrollment.student.rfidUid,
          }
        }))
      })),
      users: users,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(syncData)
  } catch (error) {
    console.error("Error in hardware sync:", error)
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    )
  }
} 