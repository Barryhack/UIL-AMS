"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  UserPlus,
  RefreshCw,
} from "lucide-react"

type Activity = {
  id: number
  type: "attendance" | "alert" | "registration" | "system"
  message: string
  time: string
  status?: "success" | "warning" | "error"
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      type: "attendance",
      message: "John Doe marked attendance for CSC 401",
      time: "Just now",
      status: "success"
    },
    {
      id: 2,
      type: "alert",
      message: "Device offline in Room 101",
      time: "2 mins ago",
      status: "error"
    },
    {
      id: 3,
      type: "registration",
      message: "New student registration request",
      time: "5 mins ago",
      status: "warning"
    },
    {
      id: 4,
      type: "system",
      message: "System backup completed",
      time: "10 mins ago",
      status: "success"
    },
    {
      id: 5,
      type: "attendance",
      message: "Jane Smith marked attendance for EEE 307",
      time: "15 mins ago",
      status: "success"
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: "attendance",
        message: `Student marked attendance for ${Math.random() > 0.5 ? 'CSC 401' : 'EEE 307'}`,
        time: "Just now",
        status: "success"
      }
      setActivities(prev => [newActivity, ...prev.slice(0, 4)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getIcon = (type: Activity["type"], status?: Activity["status"]) => {
    switch (type) {
      case "attendance":
        return <UserCheck className="h-4 w-4 text-green-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "registration":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "system":
        return <RefreshCw className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Activity["status"]) => {
    if (!status) return null
    
    const variants = {
      success: "success",
      warning: "warning",
      error: "danger"
    }

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          Live Activity
          <div className="ml-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="mt-1">{getIcon(activity.type, activity.status)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    {activity.message}
                    {activity.status && getStatusBadge(activity.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 