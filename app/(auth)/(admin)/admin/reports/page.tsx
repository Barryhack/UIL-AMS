"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const handleExport = async (type: string, category: "attendance" | "system") => {
    try {
      const response = await fetch(`/api/admin/reports/${category}?type=${type}`)
      
      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition?.split("filename=")[1] || `${category}-${type}-report.csv`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Report downloaded successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export report")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and download system reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Reports</CardTitle>
            <CardDescription>
              Export attendance records by time period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Daily Report</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("daily", "attendance")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Weekly Report</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("weekly", "attendance")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Monthly Report</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("monthly", "attendance")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Reports</CardTitle>
            <CardDescription>
              Export system statistics and performance data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">User Activity</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("users", "system")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Device Status</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("devices", "system")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">System Performance</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("performance", "system")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 