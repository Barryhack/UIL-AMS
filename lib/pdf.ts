import PDFDocument from 'pdfkit'
import type { Course, User, Attendance } from '@prisma/client'

interface CourseWithDetails extends Course {
  lecturer: User
  attendances: (Attendance & {
    student: User
  })[]
  _count: {
    enrollments: number
    attendances: number
  }
}

interface CourseStats {
  totalRecords: number
  presentCount: number
  attendanceRate: number
}

export async function generateCoursePDF(course: CourseWithDetails, stats: CourseStats): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${course.code} Attendance Report`,
          Author: 'UNILORIN AMS'
        }
      })

      // Collect PDF chunks
      const chunks: Uint8Array[] = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Add content to PDF
      // Header
      doc.fontSize(24).text('UNILORIN AMS', { align: 'center' })
      doc.fontSize(14).text('Attendance Management System', { align: 'center' })
      doc.moveDown(2)

      // Course Information
      doc.fontSize(18).text(`${course.code} - ${course.title}`)
      doc.fontSize(12).text(`Faculty: ${course.faculty} • Department: ${course.department} • Level: ${course.level}`)
      doc.text(`Lecturer: ${course.lecturer.name} • Staff ID: ${course.lecturer.staffId}`)
      doc.moveDown(2)

      // Statistics
      doc.fontSize(14).text('Course Statistics', { underline: true })
      doc.moveDown()
      const stats_y = doc.y
      const stats_col_width = (doc.page.width - 100) / 4

      // Draw stat boxes
      const drawStatBox = (x: number, label: string, value: string | number) => {
        doc.rect(x, stats_y, stats_col_width - 10, 60)
           .fillAndStroke('#f3f4f6', '#e5e7eb')
        doc.fill('#000000')
           .fontSize(10)
           .text(label, x + 10, stats_y + 10)
           .fontSize(16)
           .text(value.toString(), x + 10, stats_y + 30)
      }

      drawStatBox(50, 'Total Students', course._count.enrollments)
      drawStatBox(50 + stats_col_width, 'Total Classes', stats.totalRecords)
      drawStatBox(50 + stats_col_width * 2, 'Present Count', stats.presentCount)
      drawStatBox(50 + stats_col_width * 3, 'Attendance Rate', `${stats.attendanceRate}%`)

      doc.moveDown(5)

      // Attendance Records Table
      doc.fontSize(14).text('Attendance Records', { underline: true })
      doc.moveDown()

      // Table headers
      const startX = 50
      const columnWidth = (doc.page.width - 100) / 4
      let startY = doc.y

      doc.fontSize(10)
      const headers = ['Date', 'Student', 'Matric Number', 'Status']
      headers.forEach((header, i) => {
        doc.text(header, startX + (columnWidth * i), startY)
      })

      startY += 20
      doc.moveTo(startX, startY).lineTo(startX + doc.page.width - 100, startY).stroke()

      // Table rows
      doc.fontSize(10)
      course.attendances.forEach((record, index) => {
        // Add new page if needed
        if (startY > doc.page.height - 100) {
          doc.addPage()
          startY = 50
        }

        const y = startY + (index * 20)
        doc.text(new Date(record.date).toLocaleDateString(), startX, y)
        doc.text(record.student.name, startX + columnWidth, y)
        doc.text(record.student.matricNumber ?? "N/A", startX + columnWidth * 2, y)
        doc.text(record.status, startX + columnWidth * 3, y)

        // Draw line between rows
        doc.moveTo(startX, y + 15)
           .lineTo(startX + doc.page.width - 100, y + 15)
           .stroke()
      })

      // Footer
      doc.fontSize(10)
         .text(
           `Generated on ${new Date().toLocaleString()} • University of Ilorin Attendance Management System`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         )

      // Finalize PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
} 