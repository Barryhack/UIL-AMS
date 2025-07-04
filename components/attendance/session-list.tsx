"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CheckCircle, Clock, MapPin, UserCheck, XCircle } from "lucide-react"

interface Student {
  id: string
  name: string
  matricNumber: string
}

interface Device {
  id: string
  name: string
  serialNumber: string
  mode: string
  status: string
}

interface Course {
  code: string
  title: string
  lecturer: {
    name: string
    email: string
  }
}

interface AttendanceRecord {
  id: string
  type: string
  status: string
  timestamp: string
  student: Student
}

interface AttendanceSession {
  id: string
  startTime: string
  endTime: string
  status: string
  type: string
  location: string | null
  course: Course
  device: Device | null
  records: AttendanceRecord[]
}

interface SessionListProps {
  initialSessions: AttendanceSession[]
}

export function SessionList({ initialSessions }: SessionListProps) {
  const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  // Fetch sessions periodically
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/attendance/sessions")
        if (!response.ok) {
          // If response is not ok, don't try to parse as JSON
          // It might be a redirect to login page (HTML)
          console.error("Failed to fetch sessions, status:", response.status)
          if (response.status === 401) {
             toast.error("You are not authenticated. Please log in.");
             // Optionally redirect to login
             // router.push('/auth/login');
          }
          return; // Stop execution
        }
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error("Error fetching sessions:", error)
        // This will now only catch network errors or actual JSON parsing errors
        // on valid (2xx) responses that have malformed JSON.
      }
    }

    // Fetch immediately and then every 30 seconds
    fetchSessions()
    const interval = setInterval(fetchSessions, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleAttendanceRecord = async (sessionId: string, deviceId: string) => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          deviceId,
          studentId: session.user.id,
          type: "IN",
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to record attendance")
      }

      toast.success("Attendance recorded successfully")
      router.refresh()
    } catch (error) {
      console.error("Attendance recording error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to record attendance")
    } finally {
      setIsLoading(false)
    }
  }

  const getSessionStatus = (session: AttendanceSession) => {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)

    if (now < startTime) return "UPCOMING"
    if (now > endTime) return "ENDED"
    return "ACTIVE"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance Sessions</h2>
        <p className="text-muted-foreground">View and record attendance for your courses</p>
      </div>

      <div className="grid gap-4">
        {sessions.map((attendanceSession) => {
          const status = getSessionStatus(attendanceSession)
          const hasRecorded = session?.user ? attendanceSession.records.some(
            record => record.student.id === session.user.id
          ) : false

          return (
            <Card key={attendanceSession.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{attendanceSession.course.code}</CardTitle>
                    <CardDescription>{attendanceSession.course.title}</CardDescription>
                  </div>
                  <Badge variant={
                    status === "ACTIVE" ? "success" :
                    status === "UPCOMING" ? "warning" : "danger"
                  }>
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(attendanceSession.startTime), "h:mm a")} - {format(new Date(attendanceSession.endTime), "h:mm a")}
                      </span>
                    </div>
                    {attendanceSession.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{attendanceSession.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{attendanceSession.records.length} students recorded</span>
                    </div>
                  </div>

                  {session?.user?.role === "STUDENT" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasRecorded ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-500">Attendance recorded</span>
                          </>
                        ) : status === "ACTIVE" ? (
                          <>
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-yellow-500">Waiting for attendance</span>
                          </>
                        ) : status === "ENDED" ? (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-sm text-red-500">Session ended</span>
                          </>
                        ) : null}
                      </div>
                      {status === "ACTIVE" && !hasRecorded && attendanceSession.device && (
                        <Button
                          onClick={() => handleAttendanceRecord(attendanceSession.id, attendanceSession.device!.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Recording..." : "Record Attendance"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No active attendance sessions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 