import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"

interface Lecturer {
  id: string
  name: string
  email: string
}

interface Schedule {
  day: string
  startTime: string
  endTime: string
  venue: string
}

interface Course {
  id: string
  code: string
  title: string
  units: number
  level: string
  semester: string
  academicYear: string
  faculty: string
  department: string
  lecturer: Lecturer | null
  schedules: Schedule[]
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const courses = await prisma.course.findMany({
    where: {
      enrollments: {
        some: {
          studentId: session.user.id,
          status: "ENROLLED"
        }
      }
    },
    include: {
      lecturer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      schedules: {
        select: {
          day: true,
          startTime: true,
          endTime: true,
          venue: true
        }
      }
    }
  })

  const formattedCourses: Course[] = courses.map(course => ({
    id: course.id,
    code: course.code,
    title: course.title,
    units: course.units,
    level: course.level,
    semester: course.semester,
    academicYear: course.academicYear,
    faculty: course.faculty,
    department: course.department,
    lecturer: course.lecturer,
    schedules: course.schedules
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View all your enrolled courses for this semester</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formattedCourses.map((course) => (
          <Card key={course.id} className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{course.code}</h3>
                <span className="text-sm text-muted-foreground">{course.units} Units</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{course.title}</p>
              <div className="text-sm space-y-1">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Lecturer:</span>
                  <span>{course.lecturer?.name || "Not Assigned"}</span>
                </p>
                {course.lecturer?.email && (
                  <p className="text-xs text-muted-foreground">
                    {course.lecturer.email}
                  </p>
                )}
                {course.schedules.map((schedule, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {schedule.day} • {schedule.startTime}-{schedule.endTime} • {schedule.venue}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 