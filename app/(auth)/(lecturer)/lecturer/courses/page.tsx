import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SessionManagement } from "@/components/attendance/session-management"
import { Calendar, Users, Clock } from "lucide-react"
import Link from "next/link"
import LecturerCoursesClient from "./LecturerCoursesClient"

export default async function LecturerCourses() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const courses = await prisma.course.findMany({
    where: { lecturerId: session.user.id },
    include: {
      _count: { select: { enrollments: true, attendances: true } },
      schedules: true,
      devices: {
        include: { device: true }
      }
    },
    orderBy: { code: 'asc' }
  })

  const allDevices = await prisma.device.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: 'asc' }
  })

  // --- CLIENT COMPONENT LOGIC ---
  // If you need interactivity (useState, handlers, etc.), move the following logic into a separate client component and pass 'courses' as a prop.

  /*
  const [open, setOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const handleTakeAttendance = (courseId: string) => {
    setSelectedCourseId(courseId)
    setOpen(true)
  }
  */

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
      </div>

      <LecturerCoursesClient courses={courses} allDevices={allDevices} />

      {/*
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Attendance Session</DialogTitle>
          </DialogHeader>
          <SessionManagement
            courses={courses}
            preselectedCourseId={selectedCourseId || undefined}
            onSessionCreated={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      */}
    </div>
  )
} 