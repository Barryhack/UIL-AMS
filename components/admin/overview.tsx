"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Fingerprint, Activity } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

export function Overview() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalDevices: 0,
    recentRegistrations: [],
    attendanceStats: [],
    totalEnrollments: 0,
  })

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLecturers}</div>
            <p className="text-xs text-muted-foreground">
              Active in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Currently being offered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Connected and operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Students enrolled in courses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              Monthly attendance statistics across all courses
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.attendanceStats}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>
              Latest user registrations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recentRegistrations.map((registration: any) => (
                <div key={registration.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {registration.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {registration.role === "STUDENT"
                        ? `Student - ${registration.matricNumber}`
                        : `Lecturer - ${registration.department}`}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {new Date(registration.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 