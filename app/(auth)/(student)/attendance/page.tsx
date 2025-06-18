import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

interface Course {
  id: string
  code: string
  title: string
}

interface AttendanceRecord {
  id: string
  date: Date
  status: string
  course: Course
}

export default async function AttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: session.user.id
    },
    include: {
      course: true
    },
    orderBy: {
      date: "desc"
    }
  }) as AttendanceRecord[]

  // Calculate overall attendance rate
  const totalClasses = attendanceRecords.length
  const presentClasses = attendanceRecords.filter(record => record.status === "PRESENT").length
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">Track your attendance across all courses</p>
      </div>

      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Overall Attendance Rate</h2>
          <div className="text-4xl font-bold mt-2">{attendanceRate}%</div>
          <p className="text-sm text-muted-foreground mt-1">
            Present: {presentClasses} / Total: {totalClasses} classes
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Attendance Records</h2>
        <div className="grid gap-4">
          {attendanceRecords.map((record) => (
            <Card key={record.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{record.course.code}</h3>
                  <p className="text-sm text-muted-foreground">{record.course.title}</p>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    record.status === "PRESENT" ? "text-green-600" : "text-red-600"
                  }`}>
                    {record.status}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.date), "PPP")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 