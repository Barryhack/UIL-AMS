"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { TimeSlotPicker } from "@/components/time-slot-picker"
import { PrerequisiteSelector } from "@/components/prerequisite-selector"

const courseFormSchema = z.object({
  code: z.string().min(3).max(10),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  units: z.number().min(1).max(6),
  level: z.enum(["100", "200", "300", "400", "500"]),
  facultyId: z.string().min(1),
  departmentId: z.string().min(1),
  maxCapacity: z.number().min(1).max(500),
  timeSlots: z.array(z.object({
    day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
    startTime: z.string(),
    endTime: z.string(),
    venue: z.string(),
  })).min(1),
  prerequisites: z.array(z.string()),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

export function CourseForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      units: 3,
      level: "100",
      facultyId: session?.user?.facultyId || "",
      departmentId: session?.user?.departmentId || "",
      maxCapacity: 60,
      timeSlots: [],
      prerequisites: [],
    },
  })

  async function onSubmit(data: CourseFormValues) {
    try {
      setIsLoading(true)
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      toast.success("Course created successfully")
      router.push("/courses")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CSC101" {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for this course.
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
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Introduction to Programming" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full name of the course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter course description..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of the course content and objectives.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Units</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The number of credit units for this course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["100", "200", "300", "400", "500"].map((level) => (
                          <SelectItem key={level} value={level}>
                            {level} Level
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The academic level for this course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The maximum number of students that can enroll.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Time Slots</h3>
            <TimeSlotPicker
              value={form.watch("timeSlots")}
              onChange={(timeSlots) => form.setValue("timeSlots", timeSlots)}
            />
            {form.formState.errors.timeSlots && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.timeSlots.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Prerequisites</h3>
            <PrerequisiteSelector
              value={form.watch("prerequisites")}
              onChange={(prerequisites) => form.setValue("prerequisites", prerequisites)}
            />
            {form.formState.errors.prerequisites && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.prerequisites.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Course"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 