import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/admin/charts"

const attendanceData = [
  { name: "Week 1", total: 85 },
  { name: "Week 2", total: 92 },
  { name: "Week 3", total: 88 },
  { name: "Week 4", total: 90 },
  { name: "Week 5", total: 87 },
]

const courseData = [
  { name: "CSC", attendance: 88 },
  { name: "MTH", attendance: 92 },
  { name: "PHY", attendance: 85 },
  { name: "CHM", attendance: 90 },
  { name: "BIO", attendance: 87 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">System-wide analytics and statistics</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={attendanceData} dataKey="total" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart data={courseData} dataKey="attendance" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 