import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, FileSpreadsheet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PDFButton } from "@/components/pdf/pdf-button"

export default async function LecturerReports() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get all courses with attendance statistics
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

  // Calculate attendance rates for each course
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const stats = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          courseId: course.id
        },
        _count: true
      })

      const totalRecords = stats.reduce((acc, stat) => acc + stat._count, 0)
      const presentCount = stats.find(s => s.status === 'PRESENT')?._count || 0
      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

      return {
        ...course,
        stats: {
          totalRecords,
          presentCount,
          attendanceRate
        }
      }
    })
  )

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download attendance reports for your courses</p>
        </div>
        <Button asChild>
          <a href="/api/reports/all?format=csv" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export All as CSV
          </a>
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Total Classes</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Attendance Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseStats.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{course.code}</p>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                  </div>
                </TableCell>
                <TableCell>{course._count.enrollments}</TableCell>
                <TableCell>{course.stats.totalRecords}</TableCell>
                <TableCell>{course.stats.presentCount}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    course.stats.attendanceRate >= 75
                      ? 'bg-green-50 text-green-700'
                      : course.stats.attendanceRate >= 50
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {course.stats.attendanceRate}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Report
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <PDFButton courseId={course.id} courseName={course.code} />
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/api/reports/course/${course.id}?format=csv`} className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Download as CSV
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 