"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    id: 1,
    user: {
      name: "John Doe",
      initials: "JD",
    },
    action: "marked attendance for",
    target: "CSC 401",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: {
      name: "Sarah Wilson",
      initials: "SW",
    },
    action: "registered for",
    target: "MTH 301",
    time: "5 minutes ago",
  },
  {
    id: 3,
    user: {
      name: "Michael Brown",
      initials: "MB",
    },
    action: "submitted assignment in",
    target: "PHY 201",
    time: "10 minutes ago",
  },
  {
    id: 4,
    user: {
      name: "Emily Davis",
      initials: "ED",
    },
    action: "viewed attendance for",
    target: "ENG 101",
    time: "15 minutes ago",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{activity.user.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.user.name}{" "}
              <span className="text-muted-foreground">{activity.action}</span>{" "}
              {activity.target}
            </p>
            <p className="text-sm text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
} 