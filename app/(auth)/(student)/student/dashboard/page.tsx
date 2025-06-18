import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Clock, AlertCircle, Bell, TrendingUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface AttendanceRecord {
  _count: number
  status: string
}

interface NextClass {
  time: string
  course: string
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get student's attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: session.user.id
    },
    include: {
      course: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  })

  // Get student's courses
  const courses = await prisma.course.findMany({
    where: {
      enrollments: {
        some: {
          studentId: session.user.id
        }
      }
    }
  })

  // Calculate attendance percentage
  const attendanceStats = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      studentId: session.user.id
    },
    _count: true
  })

  const totalAttendance = attendanceStats.reduce((acc: number, curr: AttendanceRecord) => acc + curr._count, 0)
  const presentCount = attendanceStats.find((stat: AttendanceRecord) => stat.status === "PRESENT")?._count || 0
  const attendancePercentage = totalAttendance > 0 
    ? Math.round((presentCount / totalAttendance) * 100) 
    : 0

  // Get next class (this would need to be implemented based on your schedule data)
  const nextClass: NextClass = {
    time: "10:00 AM",
    course: "CSC 401 - LT1"
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-muted-foreground">Here's an overview of your academic activities and attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">1</span>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Enrolled Courses</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Current semester</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Next Class</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{nextClass.time}</div>
            <div className="text-sm text-muted-foreground">{nextClass.course}</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Attendance Rate</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{attendancePercentage}%</div>
            <div className="text-sm text-muted-foreground">Overall attendance</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Absences</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{totalAttendance - presentCount}</div>
            <div className="text-sm text-muted-foreground">This semester</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Course Overview
          </h3>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {courses.map((course) => {
                const courseAttendance = attendanceRecords.filter(record => record.courseId === course.id)
                const presentInCourse = courseAttendance.filter(record => record.status === "PRESENT").length
                const attendanceRate = courseAttendance.length > 0 
                  ? (presentInCourse / courseAttendance.length) * 100 
                  : 0

                return (
                  <div 
                    key={course.id} 
                    className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{course.code}</div>
                        <div className="text-sm text-muted-foreground">{course.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {courseAttendance.length} classes
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {presentInCourse} attended
                        </div>
                      </div>
                    </div>
                    <Progress value={attendanceRate} className="h-2" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Recent Activity
          </h3>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-br from-background to-muted/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {record.course.code.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{record.course.code}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.status} - {record.course.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
} 