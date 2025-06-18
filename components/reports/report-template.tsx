"use client"

import Image from "next/image"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReportTemplateProps {
  title: string
  data: {
    summary?: {
      total: number
      present: number
      absent: number
      excused: number
    }
    attendanceByDate?: Array<{
      date: string
      present: number
      absent: number
    }>
    attendanceByStudent?: Array<{
      name: string
      attendance: number
      total: number
    }>
    deviceStats?: Array<{
      name: string
      usage: number
    }>
  }
  type: "attendance" | "performance" | "device"
  startDate?: Date
  endDate?: Date
  department?: string
  course?: string
  children?: React.ReactNode
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function ReportTemplate({
  title,
  data,
  type,
  startDate,
  endDate,
  department,
  course,
  children
}: ReportTemplateProps) {
  const renderAttendanceReport = () => (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.summary?.total}</div>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{data.summary?.present}</div>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{data.summary?.absent}</div>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{data.summary?.excused}</div>
            <p className="text-xs text-muted-foreground">Excused</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#4ade80" name="Present" />
                <Bar dataKey="absent" fill="#f87171" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Student Attendance Details</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Classes Attended</TableHead>
                <TableHead>Total Classes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.attendanceByStudent?.map((student) => (
                <TableRow key={student.name}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${(student.attendance / student.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round((student.attendance / student.total) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{student.attendance}</TableCell>
                  <TableCell>{student.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderDeviceReport = () => (
    <div className="space-y-8">
      {/* Device Usage Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Device Usage Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.deviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="usage"
                >
                  {data.deviceStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Device Details Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Device Usage Details</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.deviceStats?.map((device) => (
                <TableRow key={device.name}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.usage}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="bg-white p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <Image
              src="/images/unilorin-logo.png"
              alt="University of Ilorin"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">University of Ilorin</h1>
            <p className="text-sm text-muted-foreground">Attendance Management System</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Generated on</p>
          <p className="font-medium">{format(new Date(), "PPP")}</p>
        </div>
      </div>

      {/* Report Title */}
      <div className="border-b py-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {startDate && endDate && (
            <div>
              <span className="font-medium">Period:</span>{" "}
              {format(startDate, "PP")} - {format(endDate, "PP")}
            </div>
          )}
          {department && (
            <div>
              <span className="font-medium">Department:</span> {department}
            </div>
          )}
          {course && (
            <div>
              <span className="font-medium">Course:</span> {course}
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="py-6">
        {type === "attendance" && renderAttendanceReport()}
        {type === "device" && renderDeviceReport()}
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between text-sm text-muted-foreground">
          <div>
            <p>University of Ilorin</p>
            <p>P.M.B 1515, Ilorin</p>
            <p>Kwara State, Nigeria</p>
          </div>
          <div className="text-right">
            <p>Tel: +234 (0) xxx xxxx xxx</p>
            <p>Email: info@unilorin.edu.ng</p>
            <p>Web: www.unilorin.edu.ng</p>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>This is an official document of the University of Ilorin Attendance Management System.</p>
          <p>Generated automatically and requires no signature.</p>
        </div>
      </div>
    </div>
  )
} 