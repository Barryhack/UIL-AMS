import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ScheduleManagement } from "@/components/admin/schedule-management"

export default async function AdminSchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  // Get all courses with their schedules
  const courses = await prisma.course.findMany({
    include: {
      lecturer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      schedules: {
        orderBy: [
          { day: "asc" },
          { startTime: "asc" }
        ]
      }
    },
    orderBy: [
      { faculty: "asc" },
      { department: "asc" },
      { code: "asc" }
    ]
  })

  // Get all schedules for overview
  const schedules = await prisma.schedule.findMany({
    include: {
      course: {
        include: {
          lecturer: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: [
      { day: "asc" },
      { startTime: "asc" }
    ]
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Schedule Management</h1>
        <p className="text-muted-foreground">
          Manage course schedules and bulk import timetables from CSV or PDF files
        </p>
      </div>

      <ScheduleManagement 
        courses={courses} 
        schedules={schedules}
      />
    </div>
  )
} 