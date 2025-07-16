import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SessionManagement } from "@/components/attendance/session-management"
import { SessionList } from "@/components/attendance/session-list"
import { redirect } from "next/navigation"

export default async function AttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "LECTURER") {
    redirect("/")
  }

  // Get lecturer's courses with schedules and assigned devices
  const courses = await prisma.course.findMany({
    where: {
      lecturerId: session.user.id
    },
    include: {
      schedules: true,
      devices: {
        include: {
          device: {
            select: {
              id: true,
              name: true,
              serialNumber: true,
              mode: true,
              status: true
            }
          }
        }
      }
    }
  })

  // Fetch all active devices for the dropdown
  const allDevices = await prisma.device.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: 'asc' }
  })

  // Get active attendance sessions
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      course: {
        lecturerId: session.user.id
      },
      endTime: {
        gte: new Date()
      }
    },
    include: {
      course: {
        select: {
          code: true,
          title: true,
          lecturer: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      device: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          mode: true,
          status: true
        }
      },
      records: {
        select: {
          id: true,
          type: true,
          status: true,
          timestamp: true,
          student: {
            select: {
              id: true,
              name: true,
              matricNumber: true
            }
          }
        }
      }
    },
    orderBy: {
      startTime: "desc"
    }
  })

  // Convert Date objects to ISO strings for frontend compatibility
  const sessionsWithStringDates = sessions.map(session => ({
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    records: session.records.map(record => ({
      ...record,
      timestamp: record.timestamp.toISOString(),
      student: {
        ...record.student,
        matricNumber: record.student.matricNumber || ""
      }
    }))
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">Create and manage attendance sessions for your courses</p>
      </div>

      <SessionManagement courses={courses} allDevices={allDevices} />
      
      <SessionList initialSessions={sessionsWithStringDates} />
    </div>
  )
} 