import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RegisterCourseButton } from "@/components/student/RegisterCourseButton"

interface Course {
  id: string
  code: string
  title: string
  units: number
  lecturer: {
    name: string
  }
  enrollments: {
    studentId: string
  }[]
}

export default async function RegistrationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const courses = await prisma.course.findMany({
    include: {
      lecturer: true,
      enrollments: {
        where: {
          studentId: session.user.id
        }
      }
    }
  }) as Course[]

  const registeredCourses = courses.filter(course => (course.enrollments ?? []).length > 0)
  const availableCourses = courses.filter(course => (course.enrollments ?? []).length === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Registration</h1>
        <p className="text-muted-foreground">Register for your courses this semester</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Registered Courses</h2>
          <div className="grid gap-4">
            {registeredCourses.map((course) => (
              <Card key={course.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{course.code}</h3>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Lecturer: {course.lecturer.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{course.units} Units</div>
                    <RegisterCourseButton 
                      courseId={course.id}
                      isRegistered={true}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Available Courses</h2>
          <div className="grid gap-4">
            {availableCourses.map((course) => (
              <Card key={course.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{course.code}</h3>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Lecturer: {course.lecturer.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{course.units} Units</div>
                    <RegisterCourseButton 
                      courseId={course.id}
                      isRegistered={false}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 