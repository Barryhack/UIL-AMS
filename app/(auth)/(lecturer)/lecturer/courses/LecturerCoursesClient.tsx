"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SessionManagement } from "@/components/attendance/session-management"
import { Users, Clock, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useWebSocketContext } from "@/lib/websocket-context"
import { toast } from "sonner"

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  venue: string
}

interface Device {
  id: string
  name: string
  serialNumber: string
  mode: string
  status: string
}

interface Course {
  id: string
  code: string
  title: string
  faculty: string
  department: string
  level: string
  schedules: Schedule[]
  devices: { device: Device }[]
  _count: {
    enrollments: number
    attendances: number
  }
}

interface LecturerCoursesClientProps {
  courses: Course[]
  allDevices: Device[]
}

export default function LecturerCoursesClient({ courses, allDevices }: LecturerCoursesClientProps) {
  const [open, setOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [courseStats, setCourseStats] = useState<Record<string, { enrollments: number; attendances: number }>>({})
  
  const { isConnected, lastAttendanceUpdate } = useWebSocketContext()

  // Initialize course stats
  useEffect(() => {
    const stats: Record<string, { enrollments: number; attendances: number }> = {}
    courses.forEach(course => {
      stats[course.id] = {
        enrollments: course._count.enrollments,
        attendances: course._count.attendances
      }
    })
    setCourseStats(stats)
  }, [courses])

  // Handle real-time attendance updates
  useEffect(() => {
    if (lastAttendanceUpdate?.record) {
      const { record } = lastAttendanceUpdate
      
      // Update the attendance count for the relevant course
      if (record.courseId && courseStats[record.courseId]) {
        setCourseStats(prev => ({
          ...prev,
          [record.courseId]: {
            ...prev[record.courseId],
            attendances: prev[record.courseId].attendances + 1
          }
        }))
        
        // Show a toast notification
        toast.success(`New attendance recorded for ${record.studentName || 'a student'}`, {
          description: `Course: ${record.courseCode || 'Unknown course'}`
        })
      }
    }
  }, [lastAttendanceUpdate, courseStats])

  const handleTakeAttendance = (courseId: string) => {
    setSelectedCourseId(courseId)
    setOpen(true)
  }

  return (
    <>
      {/* WebSocket Status Indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Real-time updates active</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Real-time updates disconnected</span>
          </>
        )}
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">{course.code}</h2>
                <p className="text-muted-foreground">{course.title}</p>
                <p className="text-sm text-muted-foreground">
                  {course.faculty} • {course.department} • {course.level} Level
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleTakeAttendance(course.id)}
                >
                  <Clock className="h-4 w-4" />
                  Take Attendance
                </Button>
                <Link href={`/lecturer/courses/${course.id}/students`}>
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    View Students
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
              <div>
                <p className="text-sm font-medium">Enrolled Students</p>
                <p className="mt-1 text-2xl font-bold">
                  {courseStats[course.id]?.enrollments || course._count.enrollments}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Attendance Records</p>
                <p className="mt-1 text-2xl font-bold">
                  {courseStats[course.id]?.attendances || course._count.attendances}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Schedule</p>
                <div className="mt-1 space-y-1">
                  {course.schedules.map((schedule) => (
                    <p key={schedule.id} className="text-sm text-muted-foreground">
                      {schedule.day} • {schedule.startTime}-{schedule.endTime} • {schedule.venue}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Attendance Session</DialogTitle>
            <DialogDescription>
              Select a course and schedule to start a new attendance session.
            </DialogDescription>
          </DialogHeader>
          <SessionManagement
            courses={courses}
            allDevices={allDevices}
            preselectedCourseId={selectedCourseId || undefined}
            onSessionCreated={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 