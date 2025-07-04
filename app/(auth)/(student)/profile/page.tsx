import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap,
  Calendar,
  Building2
} from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  matricNumber: string | null
  department: string | null
  faculty: string | null
  phone?: string | null
  enrollments: {
    course: {
      code: string
      title: string
    }
  }[]
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const student = await prisma.user.findUnique({
    where: {
      id: session.user.id,
      role: "STUDENT"
    },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              code: true,
              title: true
            }
          }
        }
      }
    }
  })

  if (!student) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">Not provided</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Matric Number</p>
                <p className="font-medium">{student.matricNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{student.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Faculty</p>
                <p className="font-medium">{student.faculty || "Not specified"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Current Courses</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {student.enrollments.map(({ course }) => (
              <div key={course.code} className="p-4 rounded-lg border">
                <h3 className="font-medium">{course.code}</h3>
                <p className="text-sm text-muted-foreground">{course.title}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="md:col-span-2 flex justify-end">
          <Button variant="outline">Edit Profile</Button>
        </div>
      </div>
    </div>
  )
} 