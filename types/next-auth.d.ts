import { DefaultSession, DefaultUser } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "LECTURER" | "STUDENT"
      facultyId?: string
      departmentId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    facultyId?: string
    departmentId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    facultyId?: string
    departmentId?: string
  }
}
