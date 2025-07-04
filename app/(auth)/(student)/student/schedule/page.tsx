import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  course: {
    code: string
    title: string
    lecturer: {
      name: string
    }
    venue: string
  }
}

export default async function SchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      course: {
        enrollments: {
          some: {
            studentId: session.user.id
          }
        }
      }
    },
    include: {
      course: {
        include: {
          lecturer: true
        }
      }
    },
    orderBy: [
      {
        day: "asc"
      },
      {
        startTime: "asc"
      }
    ]
  }) as Schedule[]

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  if (schedules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground">Your weekly class timetable</p>
        </div>

        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No class schedules found. Please check back later or contact your department.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Class Schedule</h1>
        <p className="text-muted-foreground">Your weekly class timetable</p>
      </div>

      <div className="grid gap-6">
        {days.map((day) => {
          const daySchedules = schedules.filter((schedule) => schedule.day === day)
          if (daySchedules.length === 0) return null

          return (
            <Card key={day} className="p-6">
              <h2 className="text-lg font-semibold mb-4">{day}</h2>
              <div className="space-y-4">
                {daySchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-shrink-0 w-24 text-center">
                      <div className="font-medium">{schedule.startTime}</div>
                      <div className="text-sm text-muted-foreground">to</div>
                      <div className="font-medium">{schedule.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{schedule.course.code}</h3>
                      <p className="text-sm text-muted-foreground">{schedule.course.title}</p>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>{schedule.course.lecturer.name}</span>
                        <span className="mx-2">•</span>
                        <span>{schedule.course.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 