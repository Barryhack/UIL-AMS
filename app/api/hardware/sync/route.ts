import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  console.log("[Hardware Sync] Request received")
  
  try {
    console.log("[Hardware Sync] Connecting to database...")
    
    // Test database connection first
    await prisma.$connect()
    console.log("[Hardware Sync] Database connected successfully")
    
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

    console.log(`[Hardware Sync] Found ${courses.length} courses`)

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

    console.log(`[Hardware Sync] Found ${users.length} users`)

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

    console.log("[Hardware Sync] Sending response")
    return NextResponse.json(syncData)
  } catch (error) {
    console.error("[Hardware Sync] Error:", error)
    return NextResponse.json(
      { 
        error: "Failed to sync data", 
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 