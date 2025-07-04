import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { format } from "date-fns"
import { mkdir } from "fs/promises"
import { join } from "path"
import { createWriteStream } from "fs"
import { createPDF } from "@/lib/pdf-config"

interface AttendanceRecord {
  user: {
    name: string
  }
  course: {
    code: string
    title: string
  }
  createdAt: Date
  status: string
}

interface DeviceRecord {
  name: string
  type: string
  location: string
  status: string
  _count: {
    attendanceRecords: number
  }
}

interface UserRecord {
  name: string
  email: string
  role: string
  _count: {
    attendanceRecords: number
  }
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number) {
  const columnCount = headers.length
  const columnWidth = 500 / columnCount
  const rowHeight = 25
  let currentY = startY

  // Draw headers
  doc.font('Helvetica-Bold').fontSize(12)
  headers.forEach((header, i) => {
    doc.text(header, 50 + (i * columnWidth), currentY, {
      width: columnWidth,
      align: 'left'
    })
  })

  currentY += rowHeight

  // Draw rows
  doc.font('Helvetica').fontSize(10)
  rows.forEach(row => {
    row.forEach((cell, i) => {
      doc.text(cell, 50 + (i * columnWidth), currentY, {
        width: columnWidth,
        align: 'left'
      })
    })
    currentY += rowHeight

    // Add a new page if we're near the bottom
    if (currentY > doc.page.height - 50) {
      doc.addPage()
      currentY = 50
    }
  })

  return currentY
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { type, startDate, endDate } = await req.json()

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Create reports directory if it doesn't exist
    const reportsDir = join(process.cwd(), "public", "reports")
    await mkdir(reportsDir, { recursive: true })

    // Generate unique filename
    const filename = `report-${type.toLowerCase()}-${format(new Date(startDate), "yyyy-MM-dd")}-${format(
      new Date(endDate),
      "yyyy-MM-dd"
    )}-${Date.now()}.pdf`
    const filepath = join(reportsDir, filename)

    // Create PDF document with built-in fonts
    const doc = createPDF()
    
    const writeStream = createWriteStream(filepath)
    doc.pipe(writeStream)

    // Add report header
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text("UNILORIN Attendance Management System", { align: "center" })
      .moveDown()
      .fontSize(16)
      .text(`${type.replace("_", " ")} Report`, { align: "center" })
      .moveDown()
      .font('Helvetica')
      .fontSize(12)
      .text(`Generated on: ${format(new Date(), "PPP")}`)
      .text(`Period: ${format(new Date(startDate), "PPP")} to ${format(new Date(endDate), "PPP")}`)
      .moveDown(2)

    // Get report data based on type
    switch (type) {
      case "ATTENDANCE": {
        const data = await prisma.attendance.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            user: true,
            course: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        const headers = ["Student", "Course", "Time", "Status"]
        const rows = data.map((record: AttendanceRecord) => [
          record.user.name,
          `${record.course.code} - ${record.course.title}`,
          format(record.createdAt, "PPp"),
          record.status
        ])

        drawTable(doc, headers, rows, doc.y)
        break
      }

      case "DEVICE_USAGE": {
        const data = await prisma.device.findMany({
          include: {
            _count: {
              select: {
                attendanceRecords: {
                  where: {
                    createdAt: {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                    },
                  },
                },
              },
            },
          },
        })

        const headers = ["Device Name", "Type", "Location", "Status", "Total Records"]
        const rows = data.map((device: DeviceRecord) => [
          device.name,
          device.type,
          device.location,
          device.status,
          device._count.attendanceRecords.toString()
        ])

        drawTable(doc, headers, rows, doc.y)
        break
      }

      case "USER_ACTIVITY": {
        const data = await prisma.user.findMany({
          include: {
            _count: {
              select: {
                attendanceRecords: {
                  where: {
                    createdAt: {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                    },
                  },
                },
              },
            },
          },
        })

        const headers = ["Name", "Email", "Role", "Total Records"]
        const rows = data.map((user: UserRecord) => [
          user.name,
          user.email,
          user.role,
          user._count.attendanceRecords.toString()
        ])

        drawTable(doc, headers, rows, doc.y)
        break
      }

      default:
        throw new Error("Invalid report type")
    }

    // Add page numbers
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc.font('Helvetica')
        .fontSize(10)
        .text(
          `Page ${i + 1} of ${range.count}`,
          0,
          doc.page.height - 50,
          { align: "center" }
        )
    }

    // Finalize PDF
    doc.end()

    // Wait for the write stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve())
      writeStream.on('error', reject)
    })

    // Return the URL for the generated report
    const reportUrl = `/reports/${filename}`
    return NextResponse.json({ reportUrl })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    )
  }
} 