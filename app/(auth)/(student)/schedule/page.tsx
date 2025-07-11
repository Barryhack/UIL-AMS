import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"

interface Course {
  id: string
  code: string
  title: string
  lecturer: {
    name: string
  }
  schedules: {
    day: string
    startTime: string
    endTime: string
    venue: string
  }[]
}

export default async function SchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const courses = await prisma.course.findMany({
    where: {
      enrollments: {
        some: {
          studentId: session.user.id
        }
      }
    },
    include: {
      lecturer: true,
      schedules: true
    }
  })

  // Group courses by day of the week
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const scheduleByDay = days.map(day => ({
    day,
    courses: courses.filter(course => course.schedules.some(schedule => schedule.day === day))
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Class Schedule</h1>
        <p className="text-muted-foreground">Your weekly class timetable</p>
      </div>

      <div className="grid gap-6">
        {scheduleByDay.map(({ day, courses }) => (
          <Card key={day} className="p-6">
            <h2 className="text-lg font-semibold mb-4">{day}</h2>
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <h3 className="font-medium">{course.code}</h3>
                      <p className="text-sm text-muted-foreground">{course.title}</p>
                      <p className="text-sm text-muted-foreground">Lecturer: {course.lecturer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{course.schedules.find(schedule => schedule.day === day)?.startTime} - {course.schedules.find(schedule => schedule.day === day)?.endTime}</p>
                      <p className="text-sm text-muted-foreground">{course.schedules.find(schedule => schedule.day === day)?.venue || "TBA"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No classes scheduled</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
} 