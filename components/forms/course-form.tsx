"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Loader2, Plus, X, Clock, MapPin, Calendar, Book, Users, School, GraduationCap } from "lucide-react"
import { faculties } from "@/lib/university-data"
import { cn } from "@/lib/utils"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const timeSlotSchema = z.object({
  day: z.enum(["MON", "TUE", "WED", "THU", "FRI"], {
    required_error: "Day is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
})

const formSchema = z.object({
  courseCode: z.string()
    .min(3, "Course code must be at least 3 characters")
    .max(10, "Course code must not exceed 10 characters")
    .regex(/^[A-Z]{3}\s*\d{3}$/, "Course code must be in format 'ABC 123'"),
  title: z.string()
    .min(5, "Course title must be at least 5 characters")
    .max(100, "Course title must not exceed 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must not exceed 500 characters"),
  units: z.number()
    .min(1, "Course units must be at least 1")
    .max(6, "Course units must not exceed 6"),
  facultyId: z.string({
    required_error: "Please select a faculty",
  }),
  departmentId: z.string({
    required_error: "Please select a department",
  }),
  level: z.enum(["100", "200", "300", "400", "500"], {
    required_error: "Please select a level",
  }),
  semester: z.enum(["1", "2"], {
    required_error: "Please select a semester",
  }),
  prerequisites: z.array(z.string()).optional(),
  timeSlots: z.array(timeSlotSchema).min(1, "At least one time slot is required"),
  maxCapacity: z.number()
    .min(1, "Maximum capacity must be at least 1")
    .max(500, "Maximum capacity must not exceed 500"),
})

type FormValues = z.infer<typeof formSchema>

const defaultValues: Partial<FormValues> = {
  units: 3,
  semester: "1",
  timeSlots: [],
  prerequisites: [],
}

const days = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
]

export function CourseForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const selectedFacultyDepartments = faculties.find(
    (faculty) => faculty.id === selectedFaculty
  )?.departments || []

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: "", startTime: "", endTime: "", venue: "" }])
  }

  const handleRemoveTimeSlot = (index: number) => {
    const newTimeSlots = timeSlots.filter((_, i) => i !== index)
    setTimeSlots(newTimeSlots)
  }

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true)
      // TODO: Implement course creation API
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create course")
      }

      toast.success("Course created successfully")
      onClose()
    } catch (error) {
      console.error("Course creation error:", error)
      toast.error("Failed to create course")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Add New Course</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new course by filling out the information below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8">
              {/* Basic Information */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Book className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                  </div>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                          <FormLabel className="text-sm font-medium">Course Code *</FormLabel>
                  <FormControl>
                            <Input 
                              placeholder="CSC 101" 
                              {...field} 
                              className="font-mono"
                            />
                  </FormControl>
                          <FormDescription className="text-xs">
                            Format: ABC 123 (e.g., CSC 101)
                          </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                          <FormLabel className="text-sm font-medium">Course Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Introduction to Computer Science" 
                              {...field}
                              className="font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Department and Faculty */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <School className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Academic Unit</h2>
                  </div>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="facultyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Faculty *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedFaculty(value)
                              form.setValue("departmentId", "")
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select faculty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {faculties.map((faculty) => (
                                <SelectItem 
                                  key={faculty.id} 
                                  value={faculty.id}
                                  className="cursor-pointer hover:bg-muted"
                                >
                                  {faculty.name}
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
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Department *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedFaculty}
                          >
                            <FormControl>
                              <SelectTrigger className={cn(
                                "bg-background",
                                !selectedFaculty && "opacity-50 cursor-not-allowed"
                              )}>
                                <SelectValue placeholder={selectedFaculty ? "Select department" : "Select faculty first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedFacultyDepartments.map((department) => (
                                <SelectItem 
                                  key={department.id} 
                                  value={department.id}
                                  className="cursor-pointer hover:bg-muted"
                                >
                                  {department.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Course Details */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Course Details</h2>
                  </div>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Credit Units *</FormLabel>
                  <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={6}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="bg-background"
                            />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
                      name="level"
              render={({ field }) => (
                <FormItem>
                          <FormLabel className="text-sm font-medium">Level *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                              {["100", "200", "300", "400", "500"].map((level) => (
                                <SelectItem 
                                  key={level} 
                                  value={level}
                                  className="cursor-pointer hover:bg-muted"
                                >
                                  {level} Level
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
                      name="semester"
              render={({ field }) => (
                <FormItem>
                          <FormLabel className="text-sm font-medium">Semester *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                  </FormControl>
                            <SelectContent>
                              <SelectItem value="1" className="cursor-pointer hover:bg-muted">First Semester</SelectItem>
                              <SelectItem value="2" className="cursor-pointer hover:bg-muted">Second Semester</SelectItem>
                            </SelectContent>
                          </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Time Slots</h2>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTimeSlot}
                        className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </div>
                    <AnimatePresence>
                      {timeSlots.map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <div className="grid gap-6 grid-cols-1 md:grid-cols-4 items-end border-2 p-6 rounded-lg bg-card">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              onClick={() => handleRemoveTimeSlot(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
              <FormField
                control={form.control}
                              name={`timeSlots.${index}.day`}
                render={({ field }) => (
                  <FormItem>
                                  <FormLabel className="text-sm font-medium">Day *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                                      <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {days.map((day) => (
                                        <SelectItem 
                                          key={day.value} 
                                          value={day.value}
                                          className="cursor-pointer hover:bg-muted"
                                        >
                            {day.label}
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
                              name={`timeSlots.${index}.startTime`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Start Time *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input type="time" {...field} className="pl-9 bg-background" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`timeSlots.${index}.endTime`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">End Time *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input type="time" {...field} className="pl-9 bg-background" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`timeSlots.${index}.venue`}
                render={({ field }) => (
                  <FormItem>
                                  <FormLabel className="text-sm font-medium">Venue *</FormLabel>
                    <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input {...field} className="pl-9 bg-background" placeholder="Room number/name" />
                                    </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {timeSlots.length === 0 && (
                      <div className="text-center p-6 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No time slots added yet. Click the button above to add one.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description and Capacity */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Additional Information</h2>
                  </div>
                  <div className="grid gap-6 grid-cols-1">
            <FormField
              control={form.control}
                      name="description"
              render={({ field }) => (
                <FormItem>
                          <FormLabel className="text-sm font-medium">Course Description *</FormLabel>
                  <FormControl>
                            <Textarea 
                              placeholder="Enter a detailed description of the course..."
                              className="resize-none bg-background min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                    <FormField
                      control={form.control}
                      name="maxCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Maximum Capacity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={500}
                              placeholder="Enter maximum number of students"
                              className="bg-background"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Maximum number of students that can enroll in this course
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 