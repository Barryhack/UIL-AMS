"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

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
}

interface ImportedSchedule {
  courseCode: string
  day: string
  startTime: string
  endTime: string
  venue: string
  status: "valid" | "invalid" | "duplicate"
  errors?: string[]
  matchedCourse?: Course
}

interface ScheduleImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  onSuccess: () => void
}

const importSchema = z.object({
  importType: z.enum(["csv", "pdf", "manual"]),
  file: z.any().optional(),
  csvData: z.string().optional(),
  pdfData: z.string().optional(),
  manualSchedules: z.array(z.object({
    courseId: z.string().min(1, "Course is required"),
    day: z.string().min(1, "Day is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    venue: z.string().min(1, "Venue is required"),
  })).optional(),
})

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function ScheduleImportDialog({ 
  open, 
  onOpenChange, 
  courses, 
  onSuccess 
}: ScheduleImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [importedSchedules, setImportedSchedules] = useState<ImportedSchedule[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof importSchema>>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      importType: "csv",
      csvData: "",
      pdfData: "",
      manualSchedules: [],
    }
  })

  const importType = form.watch("importType")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      if (importType === "csv") {
        await handleCSVUpload(file)
      } else if (importType === "pdf") {
        await handlePDFUpload(file)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      toast.error("Failed to process file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCSVUpload = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      toast.error("CSV file must have at least a header and one data row")
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''))
    const requiredHeaders = ['coursecode', 'day', 'starttime', 'endtime', 'venue']
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      toast.error(`Missing required headers: ${missingHeaders.join(', ')}`)
      return
    }

    const schedules: ImportedSchedule[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''))
      const schedule: ImportedSchedule = {
        courseCode: values[headers.indexOf('coursecode')] || '',
        day: values[headers.indexOf('day')] || '',
        startTime: values[headers.indexOf('starttime')] || '',
        endTime: values[headers.indexOf('endtime')] || '',
        venue: values[headers.indexOf('venue')] || '',
        status: 'valid',
        errors: [],
      }

      // Validate schedule
      const validation = validateSchedule(schedule, courses)
      schedule.status = validation.isValid ? 'valid' : 'invalid'
      schedule.errors = validation.errors
      schedule.matchedCourse = validation.matchedCourse

      schedules.push(schedule)
    }

    setImportedSchedules(schedules)
    setPreviewMode(true)
    setActiveTab("preview")
    toast.success(`Processed ${schedules.length} schedules. Please review the preview.`)
  }

  const handlePDFUpload = async (file: File) => {
    // For PDF processing, we'll use a simple text extraction approach
    // In a real implementation, you might want to use a PDF parsing library
    toast.info("PDF processing is currently limited. Please use CSV format for bulk imports.")
    
    // For now, we'll show a manual input option
    form.setValue("importType", "manual")
  }

  const validateSchedule = (schedule: ImportedSchedule, courses: Course[]) => {
    const errors: string[] = []
    let matchedCourse: Course | undefined

    // Validate course code
    if (!schedule.courseCode) {
      errors.push("Course code is required")
    } else {
      // Clean the course code for comparison
      const cleanCourseCode = schedule.courseCode.replace(/\s+/g, '').toLowerCase()
      
      // Find matching course
      matchedCourse = courses.find(c => {
        const cleanDbCode = c.code.replace(/\s+/g, '').toLowerCase()
        return cleanDbCode === cleanCourseCode
      })
      
      if (!matchedCourse) {
        // Show available courses for debugging
        const availableCodes = courses.map(c => c.code).slice(0, 5).join(', ')
        errors.push(`Course code "${schedule.courseCode}" not found in the database. Available codes include: ${availableCodes}${courses.length > 5 ? '...' : ''}`)
      }
    }

    // Validate day
    const formattedDay = schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1).toLowerCase();
    if (!schedule.day) {
      errors.push("Day is required")
    } else if (!DAYS.includes(formattedDay)) {
      errors.push(`Invalid day: "${schedule.day}". Please use the full day name (e.g., Monday).`)
    }

    // Validate times
    if (!schedule.startTime) {
      errors.push("Start time is required")
    } else if (!/^\d{2}:\d{2}$/.test(schedule.startTime)) {
      errors.push(`Start time must be in HH:MM format (e.g., 09:00). Got: "${schedule.startTime}"`)
    }

    if (!schedule.endTime) {
      errors.push("End time is required")
    } else if (!/^\d{2}:\d{2}$/.test(schedule.endTime)) {
      errors.push(`End time must be in HH:MM format (e.g., 10:00). Got: "${schedule.endTime}"`)
    }

    if (schedule.startTime && schedule.endTime) {
      const start = new Date(`1970-01-01T${schedule.startTime}`)
      const end = new Date(`1970-01-01T${schedule.endTime}`)
      if (end <= start) {
        errors.push("End time must be after start time")
      }
    }

    // Validate venue
    if (!schedule.venue) {
      errors.push("Venue is required")
    }

    return {
      isValid: errors.length === 0,
      errors,
      matchedCourse
    }
  }

  const handleManualScheduleAdd = () => {
    const currentSchedules = form.getValues("manualSchedules") || []
    form.setValue("manualSchedules", [
      ...currentSchedules,
      {
        courseId: "",
        day: "",
        startTime: "",
        endTime: "",
        venue: "",
      }
    ])
  }

  const handleManualScheduleRemove = (index: number) => {
    const currentSchedules = form.getValues("manualSchedules") || []
    form.setValue("manualSchedules", currentSchedules.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    setIsLoading(true)
    try {
      let schedulesToImport: any[] = []

      if (importType === "csv" && importedSchedules.length > 0) {
        schedulesToImport = importedSchedules
          .filter(s => s.status === 'valid')
          .map(s => ({
            courseId: s.matchedCourse!.id,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            venue: s.venue,
          }))
      } else if (importType === "manual") {
        const manualSchedules = form.getValues("manualSchedules") || []
        schedulesToImport = manualSchedules.map(s => ({
          courseId: s.courseId,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          venue: s.venue,
        }))
      }

      if (schedulesToImport.length === 0) {
        toast.error("No valid schedules to import")
        return
      }

      const response = await fetch("/api/admin/schedules/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedules: schedulesToImport }),
      })

      if (!response.ok) {
        throw new Error("Failed to import schedules")
      }

      const result = await response.json()
      toast.success(`Successfully imported ${result.imported} schedules`)
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      form.reset()
      setImportedSchedules([])
      setPreviewMode(false)
    } catch (error) {
      console.error("Error importing schedules:", error)
      toast.error("Failed to import schedules")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = "CourseCode,Day,StartTime,EndTime,Venue\nCSC 101,Monday,09:00,10:00,LT1\nMAT 101,Tuesday,10:00,11:00,LT2"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "schedule-template.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Course Schedules</DialogTitle>
          <DialogDescription>
            Import course schedules from CSV files, PDF documents, or add them manually
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">File Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewMode}>Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    CSV Import
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file with course schedules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    PDF Import
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF timetable (limited support)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>PDF File</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      PDF processing is limited. For best results, use CSV format.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {importedSchedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant="default">
                      Total: {importedSchedules.length}
                    </Badge>
                    <Badge variant="secondary">
                      Valid: {importedSchedules.filter(s => s.status === 'valid').length}
                    </Badge>
                    <Badge variant="destructive">
                      Invalid: {importedSchedules.filter(s => s.status === 'invalid').length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Schedule Entry</CardTitle>
                <CardDescription>
                  Add schedules one by one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch("manualSchedules")?.map((schedule, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select
                        value={schedule.courseId}
                        onValueChange={(value) => {
                          const schedules = form.getValues("manualSchedules") || []
                          schedules[index].courseId = value
                          form.setValue("manualSchedules", [...schedules])
                        }}
                      >
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
                      <Label>Day</Label>
                      <Select
                        value={schedule.day}
                        onValueChange={(value) => {
                          const schedules = form.getValues("manualSchedules") || []
                          schedules[index].day = value
                          form.setValue("manualSchedules", [...schedules])
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => {
                          const schedules = form.getValues("manualSchedules") || []
                          schedules[index].startTime = e.target.value
                          form.setValue("manualSchedules", [...schedules])
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => {
                          const schedules = form.getValues("manualSchedules") || []
                          schedules[index].endTime = e.target.value
                          form.setValue("manualSchedules", [...schedules])
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <div className="flex gap-2">
                        <Input
                          value={schedule.venue}
                          onChange={(e) => {
                            const schedules = form.getValues("manualSchedules") || []
                            schedules[index].venue = e.target.value
                            form.setValue("manualSchedules", [...schedules])
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualScheduleRemove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={handleManualScheduleAdd}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
                <CardDescription>
                  Review schedules before importing
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedSchedules.map((schedule, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.courseCode}</div>
                            {schedule.matchedCourse && (
                              <div className="text-sm text-muted-foreground">
                                {schedule.matchedCourse.title}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{schedule.day}</TableCell>
                        <TableCell>
                          {schedule.startTime} - {schedule.endTime}
                        </TableCell>
                        <TableCell>{schedule.venue}</TableCell>
                        <TableCell>
                          {schedule.status === 'valid' ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="cursor-help">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Invalid
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <ul className="list-disc list-inside">
                                    {schedule.errors?.map((error, i) => (
                                      <li key={i}>{error}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {importedSchedules.some(s => s.status === 'invalid') && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Some schedules have validation errors and will be skipped. 
                      Hover over the "Invalid" badges on each row to see specific errors.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || (
              importType === "csv" && importedSchedules.filter(s => s.status === 'valid').length === 0
            ) || (
              importType === "manual" && (!form.getValues("manualSchedules") || form.getValues("manualSchedules")!.length === 0)
            )}
          >
            {isLoading ? "Importing..." : "Import Schedules"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 