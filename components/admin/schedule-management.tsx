"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Upload, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScheduleImportDialog } from "./schedule-import-dialog"
import { ScheduleEditDialog } from "./schedule-edit-dialog"

interface Course {
  id: string
  code: string
  title: string
  faculty: string
  department: string
  lecturer: {
    id: string
    name: string
    email: string
  }
  schedules: Schedule[]
}

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  venue: string
  course: {
    code: string
    title: string
    lecturer: {
      name: string
    }
  }
}

interface ScheduleManagementProps {
  courses: Course[]
  schedules: Schedule[]
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
]

export function ScheduleManagement({ courses, schedules }: ScheduleManagementProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedDay, setSelectedDay] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get unique faculties and departments
  const faculties = [...new Set(courses.map(course => course.faculty))]
  const departments = [...new Set(courses.map(course => course.department))]

  // Filter schedules based on search and filters
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.course.lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.venue.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFaculty = !selectedFaculty || selectedFaculty === "all" ||
      courses.find(c => c.id === schedule.course.id)?.faculty === selectedFaculty
    
    const matchesDay = !selectedDay || selectedDay === "all" || schedule.day === selectedDay

    return matchesSearch && matchesFaculty && matchesDay
  })

  // Create schedule map for timetable view
  const scheduleMap = new Map()
  filteredSchedules.forEach(schedule => {
    const key = `${schedule.day}-${schedule.startTime}`
    scheduleMap.set(key, schedule)
  })

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete schedule")
      }

      toast.success("Schedule deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast.error("Failed to delete schedule")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSample = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/schedules/generate-sample")
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to generate sample schedule: ${errorText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Sample schedule generated and downloaded.")
    } catch (error) {
      console.error("Error generating sample schedule:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDebugCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/schedules/debug-courses")
      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }
      
      const data = await response.json()
      console.log("Available courses:", data.courses)
      toast.success(`Found ${data.totalCourses} courses in database. Check console for details.`)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to fetch courses")
    }
  }, [])

  const handleExportSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/schedules/export", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export schedules")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `schedules-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Schedules exported successfully")
    } catch (error) {
      console.error("Error exporting schedules:", error)
      toast.error("Failed to export schedules")
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Course Schedules</h2>
          <p className="text-muted-foreground">
            {filteredSchedules.length} schedules found
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            onClick={handleDebugCourses}
            disabled={isLoading}
          >
            <Search className="h-4 w-4 mr-2" />
            Debug Courses
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateSample}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Sample
          </Button>
          <Button
            variant="outline"
            onClick={handleExportSchedules}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setIsImportOpen(true)}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Schedules
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search courses, lecturers, venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Faculties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faculties</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedFaculty("")
                  setSelectedDay("")
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timetable">Timetable View</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Schedules</CardTitle>
              <CardDescription>
                Manage individual course schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{schedule.course.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.course.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{schedule.day}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {schedule.venue}
                        </div>
                      </TableCell>
                      <TableCell>{schedule.course.lecturer.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSchedule(schedule)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable</CardTitle>
              <CardDescription>
                Visual representation of all schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {/* Time slots column */}
                <div className="space-y-4">
                  <div className="h-12"></div>
                  {TIME_SLOTS.map(time => (
                    <div key={time} className="h-24 flex items-start justify-end pr-4">
                      <span className="text-sm text-muted-foreground">{time}</span>
                    </div>
                  ))}
                </div>

                {/* Days columns */}
                {DAYS.map(day => (
                  <div key={day} className="space-y-4">
                    <div className="h-12 flex items-center justify-center font-semibold">
                      {day}
                    </div>
                    {TIME_SLOTS.map(time => {
                      const scheduleItem = scheduleMap.get(`${day}-${time}`)
                      return (
                        <div key={`${day}-${time}`} className="h-24 border rounded-lg p-2">
                          {scheduleItem && (
                            <div className="h-full space-y-1">
                              <p className="font-medium text-sm">{scheduleItem.course.code}</p>
                              <p className="text-xs text-muted-foreground">{scheduleItem.course.title}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {scheduleItem.startTime} - {scheduleItem.endTime}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{scheduleItem.venue}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schedules.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">
                  With scheduled classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(courses.map(c => c.lecturer.id)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Teaching scheduled courses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map(day => {
                  const daySchedules = schedules.filter(s => s.day === day)
                  return (
                    <div key={day} className="flex items-center justify-between">
                      <span className="font-medium">{day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(daySchedules.length / Math.max(...DAYS.map(d => schedules.filter(s => s.day === d).length))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">
                          {daySchedules.length}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <ScheduleImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        courses={courses}
        onSuccess={() => {
          setIsImportOpen(false)
          router.refresh()
        }}
      />

      {/* Edit Dialog */}
      {editingSchedule && (
        <ScheduleEditDialog
          schedule={editingSchedule}
          courses={courses}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            setEditingSchedule(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
} 