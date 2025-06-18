import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"
import Link from "next/link"

export default async function LecturerCourses() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get lecturer's courses with enrollment and attendance counts
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
      },
      schedules: true
    },
    orderBy: {
      code: 'asc'
    }
  })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Button>Add New Course</Button>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">{course.code}</h2>
                <p className="text-muted-foreground">{course.title}</p>
                <p className="text-sm text-muted-foreground">
                  {course.faculty} • {course.department} • {course.level} Level
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/lecturer/courses/${course.id}/attendance`}>
                  <Button variant="outline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Take Attendance
                  </Button>
                </Link>
                <Link href={`/lecturer/courses/${course.id}/students`}>
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    View Students
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
              <div>
                <p className="text-sm font-medium">Enrolled Students</p>
                <p className="mt-1 text-2xl font-bold">{course._count.enrollments}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Attendance Records</p>
                <p className="mt-1 text-2xl font-bold">{course._count.attendances}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Schedule</p>
                <div className="mt-1 space-y-1">
                  {course.schedules.map((schedule) => (
                    <p key={schedule.id} className="text-sm text-muted-foreground">
                      {schedule.day} • {schedule.startTime}-{schedule.endTime} • {schedule.venue}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 