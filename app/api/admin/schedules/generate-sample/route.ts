import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

const VENUES = [
  "LT1", "LT2", "LT3", "LR1", "LR2", "CL1", "CL2", "Lab 1", "Lab 2"
]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const START_HOUR = 8
const END_HOUR = 17 

// Helper function to shuffle an array
const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Helper to format time
const formatTime = (hour: number) => hour.toString().padStart(2, '0') + ":00"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const courses = await prisma.course.findMany({
      select: {
        code: true,
        units: true,
      }
    })

    if (courses.length === 0) {
      return new NextResponse("No courses found in the database to generate a schedule.", { status: 404 })
    }

    const scheduleSlots = new Map<string, string>() // Key: day-hour-venue, Value: courseCode
    const generatedSchedules: any[] = []

    const shuffledCourses = shuffle(courses)
    const shuffledVenues = shuffle(VENUES)

    for (const course of shuffledCourses) {
      let hoursToSchedule = course.units

      while (hoursToSchedule > 0) {
        const duration = (hoursToSchedule >= 2 && Math.random() > 0.5) ? 2 : 1
        
        let attempts = 0
        let isScheduled = false
        while(attempts < 50 && !isScheduled) {
          const day = DAYS[Math.floor(Math.random() * DAYS.length)]
          const startTime = START_HOUR + Math.floor(Math.random() * (END_HOUR - START_HOUR - duration + 1))
          const venue = shuffledVenues[Math.floor(Math.random() * shuffledVenues.length)]

          let hasCollision = false
          for (let i = 0; i < duration; i++) {
            const slotKey = `${day}-${startTime + i}-${venue}`
            if (scheduleSlots.has(slotKey)) {
              hasCollision = true
              break
            }
          }

          if (!hasCollision) {
            const scheduleEntry = {
              courseCode: course.code,
              day: day,
              startTime: formatTime(startTime),
              endTime: formatTime(startTime + duration),
              venue: venue
            }
            generatedSchedules.push(scheduleEntry)
            
            for (let i = 0; i < duration; i++) {
                const slotKey = `${day}-${startTime + i}-${venue}`
                scheduleSlots.set(slotKey, course.code)
            }
            
            isScheduled = true
            hoursToSchedule -= duration
          }
          attempts++
        }
      }
    }
    
    // Create CSV content
    const csvHeaders = ["CourseCode", "Day", "StartTime", "EndTime", "Venue"]
    const csvRows = generatedSchedules.map(s => [s.courseCode, s.day, s.startTime, s.endTime, s.venue])
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n")

    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv")
    response.headers.set("Content-Disposition", `attachment; filename="generated-schedule-${new Date().toISOString().split('T')[0]}.csv"`)

    return response
  } catch (error: any) {
    console.error("[SCHEDULE_GENERATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 