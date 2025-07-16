"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/admin/charts"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  Users, 
  Fingerprint, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

interface AnalyticsData {
  attendanceByWeek: Array<{ name: string; value: number }>
  attendanceByDepartment: Array<{ name: string; value: number }>
  fingerprintStats: {
    total: number
    success: number
    failure: number
    successRate: number
  }
  deviceErrors: number
  apiFailures: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/analytics")
        if (!res.ok) throw new Error("Failed to fetch analytics")
        setAnalytics(await res.json())
      } catch (err) {
        setError("Failed to load analytics")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide analytics and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <TrendingUp className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.attendanceByWeek.reduce((sum, week) => sum + week.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 8 weeks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fingerprint Success Rate</CardTitle>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.fingerprintStats.successRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {analytics.fingerprintStats.success} successful
              <XCircle className="h-3 w-3 ml-2 mr-1 text-red-500" />
              {analytics.fingerprintStats.failure} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deviceErrors}</div>
            <p className="text-xs text-muted-foreground">
              Total error events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Failures</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.apiFailures}</div>
            <p className="text-xs text-muted-foreground">
              Total API errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Attendance by Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={analytics.attendanceByWeek} dataKey="value" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={analytics.attendanceByDepartment} dataKey="value" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Fingerprint Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-muted-foreground">
                {analytics.fingerprintStats.successRate}%
              </span>
            </div>
            <Progress value={analytics.fingerprintStats.successRate} className="h-2" />
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Successful Scans
                  </TableCell>
                  <TableCell>{analytics.fingerprintStats.success}</TableCell>
                  <TableCell>
                    {analytics.fingerprintStats.total > 0 
                      ? Math.round((analytics.fingerprintStats.success / analytics.fingerprintStats.total) * 100)
                      : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Failed Scans
                  </TableCell>
                  <TableCell>{analytics.fingerprintStats.failure}</TableCell>
                  <TableCell>
                    {analytics.fingerprintStats.total > 0 
                      ? Math.round((analytics.fingerprintStats.failure / analytics.fingerprintStats.total) * 100)
                      : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Total Scans
                  </TableCell>
                  <TableCell>{analytics.fingerprintStats.total}</TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 