"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/admin/charts"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
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

  if (loading) return <div>Loading analytics...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!analytics) return <div>No analytics data available.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">System-wide analytics and statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Week</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={analytics.attendanceByWeek} dataKey="value" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={analytics.attendanceByDepartment} dataKey="value" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fingerprint Scan Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{analytics.fingerprintStats.successRate}%</div>
            <div className="text-sm text-muted-foreground">
              Success: {analytics.fingerprintStats.success} / {analytics.fingerprintStats.total} <br />
              Failure: {analytics.fingerprintStats.failure}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Device Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{analytics.deviceErrors}</div>
            <div className="text-sm text-muted-foreground">Total device error events</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>API Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{analytics.apiFailures}</div>
            <div className="text-sm text-muted-foreground">Total API failure events</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 