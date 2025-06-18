import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
]

export default async function LecturerSchedule() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get all courses with their schedules
  const courses = await prisma.course.findMany({
    where: {
      lecturerId: session.user.id
    },
    include: {
      schedules: true
    }
  })

  // Create a schedule map for easy lookup
  const scheduleMap = new Map()
  courses.forEach(course => {
    course.schedules.forEach(schedule => {
      const key = `${schedule.day}-${schedule.startTime}`
      scheduleMap.set(key, {
        course,
        schedule
      })
    })
  })

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
        <p className="text-muted-foreground">Your teaching timetable for this semester</p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-6 gap-4">
          {/* Time slots column */}
          <div className="space-y-4">
            <div className="h-12"></div> {/* Header spacer */}
            {TIME_SLOTS.map(time => (
              <div key={time} className="h-24 flex items-start justify-end pr-4">
                <span className="text-sm text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          {DAYS.map(day => (
            <div key={day} className="space-y-4">
              <div className="h-12 flex items-center justify-center font-semibold">
                {day}
              </div>
              {TIME_SLOTS.map(time => {
                const scheduleItem = scheduleMap.get(`${day}-${time}`)
                return (
                  <div key={`${day}-${time}`} className="h-24 border rounded-lg p-2">
                    {scheduleItem && (
                      <div className="h-full space-y-1">
                        <p className="font-medium text-sm">{scheduleItem.course.code}</p>
                        <p className="text-xs text-muted-foreground">{scheduleItem.course.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {scheduleItem.schedule.startTime} - {scheduleItem.schedule.endTime}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{scheduleItem.schedule.venue}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 