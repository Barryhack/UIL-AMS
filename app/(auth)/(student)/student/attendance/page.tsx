import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SessionList } from "@/components/attendance/session-list"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

export default async function AttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "STUDENT") {
    redirect("/")
  }

  // Get active attendance sessions for enrolled courses
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      course: {
        enrollments: {
          some: {
            studentId: session.user.id,
            status: "ENROLLED"
          }
        }
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

  // Get recent attendance history
  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: {
      studentId: session.user.id
    },
    include: {
      session: {
        select: {
          startTime: true,
          endTime: true,
          course: {
            select: {
              code: true,
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      timestamp: "desc"
    },
    take: 10
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">View and record your course attendance</p>
      </div>

      <SessionList initialSessions={sessions} />

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent History</h2>
        <div className="grid gap-4">
          {recentAttendance.map((record) => (
            <Card key={record.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{record.session.course.code}</p>
                  <p className="text-sm text-muted-foreground">{record.session.course.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{format(new Date(record.timestamp), "PPp")}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    record.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : record.status === "PENDING"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {recentAttendance.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              No attendance records found
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 