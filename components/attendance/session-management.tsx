"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RealTimeAttendance } from "./real-time-attendance"
import { v4 as uuidv4 } from 'uuid'
import { useWebSocketContext } from '@/lib/websocket-context'

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
  allDevices: Device[]
  preselectedCourseId?: string
  onSessionCreated?: () => void
}

const sessionFormSchema = z.object({
  courseId: z.string().min(1, "Course is required."),
  scheduleId: z.string().optional(),
  deviceId: z.string().optional(),
  date: z.date({ required_error: "A date is required." }),
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  location: z.string().optional(),
}).refine(data => {
    const start = new Date(`1970-01-01T${data.startTime}`);
    const end = new Date(`1970-01-01T${data.endTime}`);
    return end > start;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});


export function SessionManagement({ courses, allDevices, preselectedCourseId, onSessionCreated }: SessionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showRealTime, setShowRealTime] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { isConnected } = useWebSocketContext()

  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      courseId: "",
      scheduleId: "",
      deviceId: "",
      location: "",
      startTime: "",
      endTime: ""
    }
  })

  const selectedCourseId = form.watch("courseId")
  const selectedScheduleId = form.watch("scheduleId")
  const course = courses.find(c => c.id === selectedCourseId)

  useEffect(() => {
    if (course && selectedScheduleId) {
        const schedule = course.schedules.find(s => s.id === selectedScheduleId);
        if (schedule) {
            form.setValue("startTime", schedule.startTime);
            form.setValue("endTime", schedule.endTime);
            form.setValue("location", schedule.venue);
        }
    }
  }, [selectedScheduleId, course, form]);

  useEffect(() => {
    if (preselectedCourseId) {
      form.setValue("courseId", preselectedCourseId)
    }
  }, [preselectedCourseId, form])

  const handleSessionCreation = async (values: z.infer<typeof sessionFormSchema>) => {
    setIsLoading(true)
    try {
      const startDateTime = new Date(values.date)
      const [startHour, startMinute] = values.startTime.split(":")
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute))

      const endDateTime = new Date(values.date)
      const [endHour, endMinute] = values.endTime.split(":")
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute))

      // Call backend API to create session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: values.courseId,
          date: startDateTime.toISOString(),
          startTime: values.startTime,
          endTime: values.endTime,
          venue: values.location || ""
        })
      })
      if (!response.ok) throw new Error(await response.text())
      const sessionData = await response.json()

      // Set active session and show real-time component
      setActiveSessionId(sessionData.id)
      setShowRealTime(true)
      toast.success("Attendance session created successfully")
      router.refresh()
      form.reset()
      if (onSessionCreated) onSessionCreated()
    } catch (error) {
      console.error("Session creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create attendance session")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendanceUpdate = (record: any) => {
    console.log('Real-time attendance update:', record)
    // You can add additional logic here if needed
  }

  return (
    <div className="space-y-6">
      {showRealTime && activeSessionId && (
        <RealTimeAttendance
          sessionId={activeSessionId}
          courseId={selectedCourseId}
          onAttendanceUpdate={handleAttendanceUpdate}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Create Attendance Session</CardTitle>
          <CardDescription>
            Schedule a new attendance session for a course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSessionCreation)} className="space-y-4">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {course && (
                <>
                  <FormField
                    control={form.control}
                    name="scheduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select from a pre-defined schedule" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(course?.schedules ?? []).map((schedule) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.day} • {schedule.startTime}-{schedule.endTime} • {schedule.venue}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a hardware device" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allDevices.length === 0 ? (
                              <SelectItem disabled value="">
                                No devices registered
                              </SelectItem>
                            ) : (
                              allDevices.map((device) => (
                                <SelectItem key={device.id} value={device.id}>
                                  {device.name} ({device.mode})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                              <Input type="time" {...field} />
                          </FormControl>
                      </div>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                              <Input type="time" {...field} />
                          </FormControl>
                      </div>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                          <Input placeholder="Enter a location" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : "Create Session"}
              </Button>
              </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 