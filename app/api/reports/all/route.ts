import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Get all courses for the lecturer
    const courses = await prisma.course.findMany({
      where: {
        lecturerId: session.user.id
      },
      include: {
        lecturer: true,
        attendances: {
          include: {
            student: true
          },
          orderBy: {
            date: 'desc'
          }
        },
        _count: {
          select: {
            enrollments: true,
            attendances: true
          }
        }
      }
    })

    // Generate CSV content
    const csvRows = [
      // Header row
      ['Course Code', 'Course Title', 'Date', 'Student Name', 'Matric Number', 'Status'].join(',')
    ]

    // Add data rows for each course
    courses.forEach(course => {
      course.attendances.forEach(record => {
        csvRows.push([
          course.code,
          course.title,
          new Date(record.date).toLocaleDateString(),
          record.student.name,
          record.student.matricNumber,
          record.status
        ].join(','))
      })
    })

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance-report.csv"'
      }
    })
  } catch (error) {
    console.error('Error generating bulk report:', error)
    return new NextResponse("Error generating report", { status: 500 })
  }
} 