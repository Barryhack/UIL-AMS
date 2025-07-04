"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Clock, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface Course {
  id: string
  code: string
  title: string
  faculty: string
  department: string
  lecturer: {
    id: string
    name: string
    email: string
  }
}

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  venue: string
  course: {
    code: string
    title: string
    lecturer: {
      name: string
    }
  }
}

interface ScheduleEditDialogProps {
  schedule: Schedule
  courses: Course[]
  onClose: () => void
  onSuccess: () => void
}

const scheduleSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
}).refine(data => {
  const start = new Date(`1970-01-01T${data.startTime}`)
  const end = new Date(`1970-01-01T${data.endTime}`)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function ScheduleEditDialog({ 
  schedule, 
  courses, 
  onClose, 
  onSuccess 
}: ScheduleEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      courseId: courses.find(c => c.code === schedule.course.code)?.id || "",
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      venue: schedule.venue,
    }
  })

  const onSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to update schedule")
      }

      toast.success("Schedule updated successfully")
      onSuccess()
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast.error("Failed to update schedule")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>
            Update the schedule details for {schedule.course.code}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
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

            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="Enter venue" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 