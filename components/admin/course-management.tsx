"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { faculties } from "@/lib/university-data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CourseManagementProps {
  courses: {
    id: string
    code: string
    title: string
    faculty: string
    department: string
    lecturer: {
      id: string
      name: string
    }
    enrollments: {
      id: string
    }[]
  }[]
}

export function CourseManagement({ courses }: CourseManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [lecturers, setLecturers] = useState<Array<{ id: string; name: string }>>([])
  const router = useRouter()

  const handleCourseCreation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsLoading(true)

    try {
      const formData = new FormData(form)
      
      // Format the course code (remove space)
      const rawCode = formData.get("code") as string
      const code = rawCode.replace(/\s+/g, "")
      
      // Ensure description meets minimum length
      const description = formData.get("description") as string
      if (description.length < 20) {
        throw new Error("Description must be at least 20 characters long")
      }

      // Get faculty and department names from their IDs
      const facultyId = formData.get("faculty") as string
      const departmentId = formData.get("department") as string
      const selectedFaculty = faculties.find(f => f.id === facultyId)
      const selectedDepartment = selectedFaculty?.departments.find(d => d.id === departmentId)

      if (!selectedFaculty || !selectedDepartment) {
        throw new Error("Invalid faculty or department selection")
      }

      const courseData = {
        code,
        title: formData.get("title"),
        description,
        department: selectedDepartment.name,
        faculty: selectedFaculty.name,
        semester: formData.get("semester") as string,
        academicYear: formData.get("academicYear"),
        units: 3,
        level: "500",
        maxCapacity: 60,
        lecturerId: formData.get("lecturerId") as string
      }

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create course")
      }

      toast.success("Course created successfully")
      form.reset()
      setSelectedFaculty("") // Reset faculty selection
    } catch (error) {
      console.error("Course creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create course")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLecturers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=LECTURER")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch lecturers")
      }
      const data = await response.json()
      setLecturers(data)
    } catch (error) {
      console.error("Error fetching lecturers:", error)
      toast.error("Failed to fetch lecturers")
    }
  }

  const handleCourseAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const courseId = formData.get("courseId")
      const lecturerId = formData.get("lecturerId")

      if (!courseId || !lecturerId) {
        throw new Error("Please select both course and lecturer")
      }

      const response = await fetch("/api/admin/courses/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lecturerId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign course")
      }

      toast.success("Course assigned successfully")
      router.refresh()
    } catch (error) {
      console.error("Course assignment error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to assign course")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch lecturers on component mount
  useEffect(() => {
    fetchLecturers()
  }, [])

  // Add handleEdit function
  const handleEdit = (courseId: string) => {
    router.push(`/admin/courses/${courseId}/edit`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
          <CardDescription>
            Add a new course to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCourseCreation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input id="code" name="code" placeholder="e.g. CPT401" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input id="title" name="title" placeholder="e.g. Software Engineering" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter course description (minimum 20 characters)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select name="faculty" value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select name="department" disabled={!selectedFaculty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFaculty &&
                      faculties
                        .find((f) => f.id === selectedFaculty)
                        ?.departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select name="semester" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input id="academicYear" name="academicYear" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lecturerId">Course Lecturer</Label>
              <Select name="lecturerId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id}>
                      {lecturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Course"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Course</CardTitle>
          <CardDescription>
            Assign courses to lecturers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCourseAssignment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course</Label>
                <Select name="courseId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecturerId">Lecturer</Label>
                <Select name="lecturerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign Course"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course List</CardTitle>
          <CardDescription>
            View and manage all courses in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.lecturer.name}</TableCell>
                  <TableCell>{(course.enrollments ?? []).length}</TableCell>
                  <TableCell className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(course.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 