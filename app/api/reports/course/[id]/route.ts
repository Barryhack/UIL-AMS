import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateCoursePDF } from "@/lib/pdf"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Get course with all required data
    const course = await prisma.course.findUnique({
      where: {
        id: params.id,
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

    if (!course) {
      return new NextResponse("Course not found", { status: 404 })
    }

    // Calculate statistics
    const stats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        courseId: params.id
      },
      _count: true
    })

    const totalRecords = stats.reduce((acc, stat) => acc + stat._count, 0)
    const presentCount = stats.find(s => s.status === 'PRESENT')?._count || 0
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

    // Check if CSV format is requested
    const format = request.nextUrl.searchParams.get('format')

    if (format === 'csv') {
      // Generate CSV content
      const csvRows = [
        // Header row
        ['Date', 'Student Name', 'Matric Number', 'Status'].join(','),
        // Data rows
        ...course.attendances.map(record => [
          new Date(record.date).toLocaleDateString(),
          record.student.name,
          record.student.matricNumber,
          record.status
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${course.code}-attendance-report.csv"`
        }
      })
    }

    // Generate PDF
    const pdfBuffer = await generateCoursePDF(course, {
      totalRecords,
      presentCount,
      attendanceRate
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${course.code}-attendance-report.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return new NextResponse("Error generating report", { status: 500 })
  }
} 