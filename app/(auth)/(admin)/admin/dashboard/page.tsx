"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/admin/charts"
import { 
  Users, 
  BookOpen, 
  Fingerprint, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const attendanceData = [
  { name: "Mon", total: 85 },
  { name: "Tue", total: 92 },
  { name: "Wed", total: 88 },
  { name: "Thu", total: 90 },
  { name: "Fri", total: 87 },
]

const courseData = [
  { name: "CSC 201", attendance: 88 },
  { name: "MTH 101", attendance: 92 },
  { name: "PHY 101", attendance: 85 },
  { name: "CHM 101", attendance: 90 },
  { name: "BIO 101", attendance: 87 },
]

const recentActivities = [
  { id: 1, message: "New student registered", time: "2 minutes ago", type: "user" },
  { id: 2, message: "Attendance recorded for CSC 201", time: "5 minutes ago", type: "attendance" },
  { id: 3, message: "New device connected", time: "10 minutes ago", type: "device" },
  { id: 4, message: "System backup completed", time: "15 minutes ago", type: "system" },
]

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getTrendIcon()}
            <span className="ml-1">{description}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome to your admin dashboard. Here's what's happening today.</p>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">3</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="2,350"
          description="+180 from last month"
          icon={<Users className="h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Active Courses"
          value="42"
          description="This semester"
          icon={<BookOpen className="h-4 w-4" />}
          trend="neutral"
        />
        <StatCard
          title="Active Devices"
          value="15"
          description="Online now"
          icon={<Fingerprint className="h-4 w-4" />}
          trend="neutral"
        />
        <StatCard
          title="System Health"
          value="98.5%"
          description="All systems operational"
          icon={<Activity className="h-4 w-4" />}
          trend="up"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] mt-4">
              <Chart 
                data={attendanceData} 
                dataKey="total" 
                type={"area"}
                showAxis={true}
                showTooltip={true}
                gradient={true}
                animated={true}
                height={350}
              />
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 grid gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                Course Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] mt-4">
                <Chart 
                  data={courseData} 
                  dataKey="attendance" 
                  type={"bar"}
                  showAxis={true}
                  showTooltip={true}
                  gradient={false}
                  animated={true}
                  height={250}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px] pr-4">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 