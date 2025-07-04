import React from "react"

interface CourseReportProps {
  course: {
    id: string
    code: string
    title: string
    description: string
    units: number
    faculty: string
    department: string
    lecturer: {
      name: string
      email: string
    }
  }
  stats: {
    totalStudents: number
    attendanceRate: number
    averageAttendance: number
  }
}

export function CourseReport({ course, stats }: CourseReportProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Course Report</h1>
        <h2 className="text-xl text-gray-600">{course.code} - {course.title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Course Information</h3>
          <div className="space-y-2">
            <p><strong>Code:</strong> {course.code}</p>
            <p><strong>Title:</strong> {course.title}</p>
            <p><strong>Units:</strong> {course.units}</p>
            <p><strong>Faculty:</strong> {course.faculty}</p>
            <p><strong>Department:</strong> {course.department}</p>
            <p><strong>Lecturer:</strong> {course.lecturer.name}</p>
            <p><strong>Email:</strong> {course.lecturer.email}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Attendance Statistics</h3>
          <div className="space-y-2">
            <p><strong>Total Students:</strong> {stats.totalStudents}</p>
            <p><strong>Attendance Rate:</strong> {stats.attendanceRate}%</p>
            <p><strong>Average Attendance:</strong> {stats.averageAttendance}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Course Description</h3>
        <p className="text-gray-700">{course.description}</p>
      </div>
    </div>
  )
} 