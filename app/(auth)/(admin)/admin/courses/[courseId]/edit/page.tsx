"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { faculties } from "@/lib/university-data"
import prisma from "@/lib/prisma"

interface PageProps {
  params: {
    courseId: string
  }
}

export default function EditCoursePage({ params }: PageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [lecturers, setLecturers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    // Fetch course data
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/admin/courses/${params.courseId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch course")
        }
        const data = await response.json()
        setCourse(data)
        setSelectedFaculty(data.faculty)
      } catch (error) {
        console.error("Error fetching course:", error)
        toast.error("Failed to fetch course details")
        router.push("/admin/courses")
      }
    }

    // Fetch lecturers
    const fetchLecturers = async () => {
      try {
        const response = await fetch("/api/admin/users?role=LECTURER")
        if (!response.ok) {
          throw new Error("Failed to fetch lecturers")
        }
        const data = await response.json()
        setLecturers(data)
      } catch (error) {
        console.error("Error fetching lecturers:", error)
        toast.error("Failed to fetch lecturers")
      }
    }

    fetchCourse()
    fetchLecturers()
  }, [params.courseId, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
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
        semester: formData.get("semester"),
        academicYear: formData.get("academicYear"),
        units: Number(formData.get("units")),
        level: formData.get("level"),
        maxCapacity: Number(formData.get("maxCapacity")),
        lecturerId: formData.get("lecturerId")
      }

      const response = await fetch(`/api/admin/courses/${params.courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update course")
      }

      toast.success("Course updated successfully")
      router.push("/admin/courses")
      router.refresh()
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update course")
    } finally {
      setIsLoading(false)
    }
  }

  if (!course) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit Course</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Update the course details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input 
                  id="code" 
                  name="code" 
                  defaultValue={course.code}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={course.title}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={course.description}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select name="faculty" defaultValue={course.faculty} onValueChange={setSelectedFaculty}>
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
                <Select name="department" defaultValue={course.department}>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select name="semester" defaultValue={course.semester}>
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
                <Input 
                  id="academicYear" 
                  name="academicYear" 
                  defaultValue={course.academicYear}
                  required 
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="units">Credit Units</Label>
                <Input 
                  id="units" 
                  name="units" 
                  type="number"
                  min={1}
                  max={6}
                  defaultValue={course.units}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select name="level" defaultValue={course.level}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                <Input 
                  id="maxCapacity" 
                  name="maxCapacity" 
                  type="number"
                  min={1}
                  defaultValue={course.maxCapacity}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecturerId">Course Lecturer</Label>
                <Select name="lecturerId" defaultValue={course.lecturerId}>
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

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Course"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 