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
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface GenerateReportDialogProps {
  open: boolean
  onClose: () => void
  onGenerate?: (report: any) => void
}

export function GenerateReportDialog({ open, onClose, onGenerate }: GenerateReportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    department: "",
    course: "",
  })

  const validateForm = () => {
    if (!formData.type) {
      setError("Please select a report type")
      return false
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Please select both start and end dates")
      return false
    }
    if (!formData.department) {
      setError("Please select a department")
      return false
    }
    return true
  }

  const generateSampleData = (type: string) => {
    if (type === "attendance") {
      return {
        summary: {
          total: 120,
          present: 95,
          absent: 20,
          excused: 5,
        },
        attendanceByDate: [
          { date: "2024-05-01", present: 90, absent: 30 },
          { date: "2024-05-02", present: 85, absent: 35 },
          { date: "2024-05-03", present: 95, absent: 25 },
          { date: "2024-05-04", present: 88, absent: 32 },
          { date: "2024-05-05", present: 92, absent: 28 },
        ],
        attendanceByStudent: [
          { name: "John Doe", attendance: 45, total: 50 },
          { name: "Jane Smith", attendance: 48, total: 50 },
          { name: "Mike Johnson", attendance: 42, total: 50 },
          { name: "Sarah Williams", attendance: 47, total: 50 },
          { name: "David Brown", attendance: 44, total: 50 },
        ],
      }
    }
    if (type === "device") {
      return {
        deviceStats: [
          { name: "Fingerprint Scanner 1", usage: 1200 },
          { name: "Fingerprint Scanner 2", usage: 980 },
          { name: "RFID Reader 1", usage: 850 },
          { name: "RFID Reader 2", usage: 920 },
        ],
      }
    }
    return {}
  }

  const exportToPDF = async (reportElement: HTMLElement) => {
    try {
      const canvas = await html2canvas(reportElement)
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save(`report-${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (err) {
      console.error("Failed to export PDF:", err)
      setError("Failed to export PDF. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reports/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      // if (!response.ok) throw new Error('Failed to generate report')
      // const data = await response.json()

      // Simulate API call with sample data
      await new Promise(resolve => setTimeout(resolve, 2000))
      const reportData = generateSampleData(formData.type)
      
      if (onGenerate) {
        onGenerate({
          ...reportData,
          title: `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Report`,
          type: formData.type,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          department: formData.department,
          course: formData.course,
        })
      }
      
      onClose()
    } catch (err) {
      setError("Failed to generate report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Select the type of report and specify the parameters
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Report Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="performance">Performance Analysis</SelectItem>
                  <SelectItem value="device">Device Usage Statistics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course (Optional)</Label>
              <Select
                value={formData.course}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csc401">CSC401 - Database Management</SelectItem>
                  <SelectItem value="csc403">CSC403 - Software Engineering</SelectItem>
                  <SelectItem value="csc405">CSC405 - Computer Networks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 