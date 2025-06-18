import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Course {
  id: string
  code: string
  title: string
  creditHours: number
  capacity: number
  enrollments: { id: string }[]
  lecturer: {
    name: string
  }
}

interface Enrollment {
  courseId: string
}

export default async function RegistrationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get all available courses and current student's enrollments
  const courses = await prisma.course.findMany({
    where: {
      semester: "CURRENT", // Assuming you have a semester field
      isActive: true
    },
    include: {
      lecturer: true,
      enrollments: true
    }
  }) as Course[]

  const studentEnrollments = await prisma.enrollment.findMany({
    where: {
      studentId: session.user.id
    },
    select: {
      courseId: true
    }
  }) as Enrollment[]

  const enrolledCourseIds = new Set(studentEnrollments.map(e => e.courseId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Registration</h1>
        <p className="text-muted-foreground">Register for courses this semester</p>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id)
          const isFull = course.enrollments.length >= course.capacity

          return (
            <Card key={course.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{course.code}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({course.creditHours} Units)
                    </span>
                  </div>
                  <p className="text-muted-foreground">{course.title}</p>
                  <p className="text-sm">Lecturer: {course.lecturer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {course.enrollments.length} / {course.capacity} students enrolled
                  </p>
                </div>
                <form action={async () => {
                  'use server'
                  if (isEnrolled) {
                    await prisma.enrollment.deleteMany({
                      where: {
                        studentId: session.user.id,
                        courseId: course.id
                      }
                    })
                  } else {
                    await prisma.enrollment.create({
                      data: {
                        studentId: session.user.id,
                        courseId: course.id
                      }
                    })
                  }
                }}>
                  <Button 
                    type="submit"
                    variant={isEnrolled ? "destructive" : "default"}
                    disabled={!isEnrolled && isFull}
                  >
                    {isEnrolled ? "Drop Course" : isFull ? "Course Full" : "Enroll"}
                  </Button>
                </form>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 