"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Device {
  id: string
  name: string
  serialNumber: string
  mode: string
  status: string
}

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  venue: string
}

interface Course {
  id: string
  code: string
  title: string
  schedules: Schedule[]
  devices: {
    device: Device
  }[]
}

interface SessionManagementProps {
  courses: Course[]
}

export function SessionManagement({ courses }: SessionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedSchedule, setSelectedSchedule] = useState<string>("")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const { data: session } = useSession()
  const router = useRouter()

  const course = courses.find(c => c.id === selectedCourse)

  const handleSessionCreation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      if (!selectedDate || !startTime || !endTime) {
        throw new Error("Please fill in all required fields")
      }

      const startDateTime = new Date(selectedDate)
      const [startHour, startMinute] = startTime.split(":")
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute))

      const endDateTime = new Date(selectedDate)
      const [endHour, endMinute] = endTime.split(":")
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute))

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time")
      }

      const response = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          scheduleId: selectedSchedule || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          deviceId: selectedDevice || undefined,
          location: location || undefined,
          type: selectedSchedule ? "SCHEDULED" : "MANUAL"
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create attendance session")
      }

      toast.success("Attendance session created successfully")
      router.refresh()
      
      // Reset form
      setSelectedSchedule("")
      setSelectedDevice("")
      setSelectedDate(undefined)
      setStartTime("")
      setEndTime("")
      setLocation("")
    } catch (error) {
      console.error("Session creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create attendance session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Attendance Session</CardTitle>
        <CardDescription>
          Schedule a new attendance session for a course.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSessionCreation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {course && (
            <>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Select
                  value={selectedSchedule}
                  onValueChange={setSelectedSchedule}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {course.schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.day} • {schedule.startTime}-{schedule.endTime} • {schedule.venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device">Device (Optional)</Label>
                <Select
                  value={selectedDevice}
                  onValueChange={setSelectedDevice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {course.devices.map(({ device }) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} ({device.mode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 