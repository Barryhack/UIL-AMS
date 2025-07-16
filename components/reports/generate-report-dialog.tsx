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
      // TODO: Replace with real API call to fetch report data
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error('Failed to generate report')
      const reportData = await response.json()
      
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
      <DialogContent className="sm:max-w-lg w-full h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Select the type of report and specify the parameters
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
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
          </div>
          <div className="bg-background border-t pt-4 mt-2">
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 