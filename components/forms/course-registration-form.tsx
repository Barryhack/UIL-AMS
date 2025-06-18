"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { faculties } from "@/lib/university-data"

interface CourseRegistrationFormProps {
  open: boolean
  onClose: () => void
}

export function CourseRegistrationForm({ open, onClose }: CourseRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    faculty: "",
    department: "",
    level: "",
    semester: "",
    units: "",
    lecturer: "",
    description: "",
    schedule: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement API call to save course data
    setTimeout(() => {
      setLoading(false)
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Enter the course details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. CSC401"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Credit Units</Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={formData.units}
                  onChange={(e) => setFormData(prev => ({ ...prev, units: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-faculty">Faculty</Label>
              <Select
                value={formData.faculty}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, faculty: value, department: "" }))
                  setSelectedFaculty(value)
                }}
              >
                <SelectTrigger id="register-faculty">
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
              <Label htmlFor="register-department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                disabled={!selectedFaculty}
              >
                <SelectTrigger id="register-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFaculty && faculties
                    .find((f) => f.id === selectedFaculty)
                    ?.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger id="register-level">
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
              <div className="space-y-2">
                <Label htmlFor="register-semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                >
                  <SelectTrigger id="register-semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Semester</SelectItem>
                    <SelectItem value="second">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-lecturer">Course Lecturer</Label>
              <Select
                value={formData.lecturer}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lecturer: value }))}
              >
                <SelectTrigger id="register-lecturer">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dr-john-doe">Dr. John Doe</SelectItem>
                  <SelectItem value="prof-jane-smith">Prof. Jane Smith</SelectItem>
                  <SelectItem value="dr-mike-johnson">Dr. Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-schedule">Class Schedule</Label>
              <Input
                id="register-schedule"
                placeholder="e.g. Monday 10:00 AM - 12:00 PM"
                required
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-description">Course Description</Label>
              <Textarea
                id="register-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 