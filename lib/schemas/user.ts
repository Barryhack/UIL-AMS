import { z } from "zod"

export const userRegistrationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email().endsWith("@unilorin.edu.ng", "Must be a valid Unilorin email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  matricNumber: z.string().optional(),
  staffId: z.string().optional(),
  biometricData: z.string({
    required_error: "Fingerprint scan is required",
  }),
  rfidData: z.string({
    required_error: "RFID card scan is required",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "STUDENT" && !data.matricNumber) {
    return false
  }
  return true
}, {
  message: "Matric number is required for students",
  path: ["matricNumber"],
}).refine((data) => {
  if (data.role === "LECTURER" && !data.staffId) {
    return false
  }
  return true
}, {
  message: "Staff ID is required for lecturers",
  path: ["staffId"],
})

export type UserRegistrationData = z.infer<typeof userRegistrationSchema> 