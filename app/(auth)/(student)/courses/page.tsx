import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"

interface Lecturer {
  id: string
  name: string
}

interface Course {
  id: string
  code: string
  title: string
  creditHours: number
  schedule?: string | null
  lecturer: Lecturer
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const courses = await prisma.course.findMany({
    where: {
      enrollments: {
        some: {
          studentId: session.user.id
        }
      }
    },
    include: {
      lecturer: true
    }
  }) as Course[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View all your enrolled courses for this semester</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{course.code}</h3>
                <span className="text-sm text-muted-foreground">{course.creditHours} Units</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{course.title}</p>
              <div className="text-sm">
                <p>Lecturer: {course.lecturer.name}</p>
                <p>Schedule: {course.schedule || "TBA"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 