import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { CourseManagement } from "@/components/admin/course-management"

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const courses = await prisma.course.findMany({
    orderBy: {
      code: "asc"
    },
    include: {
      lecturer: {
        select: {
          id: true,
          name: true,
        }
      },
      enrollments: {
        select: {
          id: true,
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">Manage courses and their assignments</p>
      </div>

      <CourseManagement courses={courses} />
    </div>
  )
} 