"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, Clock, Bell, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface Course {
  id: string
  code: string
  title: string
  _count?: {
    enrollments: number
    attendances: number
  }
}

interface AttendanceRecord {
  id: string
  status: string
  createdAt: string
  student: {
    name: string
  }
  course: {
    code: string
  }
}

export default function LecturerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch("/api/lecturer/courses")
      const coursesData = await coursesRes.json()
      setCourses(coursesData)

      // Fetch recent attendance
      const attendanceRes = await fetch("/api/lecturer/recent-attendance")
      const attendanceData = await attendanceRes.json()
      setRecentAttendance(attendanceData)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!session?.user) {
    return null
  }

  // Calculate statistics
  const totalStudents = courses.reduce((acc, course) => acc + (course._count?.enrollments || 0), 0)
  const totalAttendance = courses.reduce((acc, course) => acc + (course._count?.attendances || 0), 0)
  const averageAttendance = courses.length > 0 ? Math.round(totalAttendance / courses.length) : 0

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-muted-foreground">Here's an overview of your courses and student attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">2</span>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => router.push("/lecturer/schedule")}>
            <Calendar className="h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Total Courses</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Active courses</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Total Students</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <div className="text-sm text-muted-foreground">Enrolled students</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Average Attendance</span>
          </div>
          <div>
            <div className="text-3xl font-bold">{averageAttendance}</div>
            <div className="text-sm text-muted-foreground">Records per course</div>
          </div>
        </Card>

        <Card className="p-6 space-y-2 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Next Class</span>
          </div>
          <div>
            <div className="text-3xl font-bold">10:00 AM</div>
            <div className="text-sm text-muted-foreground">CSC 401 - LT1</div>
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
              {courses.map((course) => (
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
                      <div className="font-medium">{course._count?.enrollments || 0} students</div>
                      <div className="text-sm text-muted-foreground">{course._count?.attendances || 0} records</div>
                    </div>
                  </div>
                  <Progress 
                    value={course._count?.attendances ? (course._count.attendances / (course._count.enrollments * 10)) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
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
              {recentAttendance.map((record) => (
                <div 
                  key={record.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-br from-background to-muted/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {record.student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{record.student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.status} - {record.course.code}
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