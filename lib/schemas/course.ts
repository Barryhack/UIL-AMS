import { z } from "zod"

export const courseSchema = z.object({
  code: z.string()
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
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  level: z.enum(["100", "200", "300", "400", "500"], {
    required_error: "Please select a level",
  }),
  semester: z.enum(["FIRST", "SECOND"], {
    required_error: "Please select a semester",
  }),
  lecturer: z.string().min(1, "Lecturer is required"),
  schedule: z.object({
    days: z.array(z.string()).min(1, "At least one day is required"),
    time: z.string().min(1, "Time is required"),
  }),
  capacity: z.number()
    .min(1, "Capacity must be at least 1")
    .max(500, "Capacity must not exceed 500"),
})

export type CourseData = z.infer<typeof courseSchema>

export const days = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
] as const 