"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentActivities = [
  {
    name: "John Doe",
    email: "john@unilorin.edu.ng",
    type: "Check In",
    time: "2 minutes ago",
    course: "CSC 401",
    imageUrl: "/avatars/01.png",
  },
  {
    name: "Sarah Wilson",
    email: "sarah@unilorin.edu.ng",
    type: "Check Out",
    time: "5 minutes ago",
    course: "CSC 405",
    imageUrl: "/avatars/02.png",
  },
  {
    name: "Michael Brown",
    email: "michael@unilorin.edu.ng",
    type: "Check In",
    time: "10 minutes ago",
    course: "CSC 403",
    imageUrl: "/avatars/03.png",
  },
  {
    name: "Emily Davis",
    email: "emily@unilorin.edu.ng",
    type: "Check In",
    time: "15 minutes ago",
    course: "CSC 407",
    imageUrl: "/avatars/04.png",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {recentActivities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.imageUrl} alt={activity.name} />
            <AvatarFallback>
              {activity.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.name}</p>
            <p className="text-sm text-muted-foreground">
              {activity.type} - {activity.course}
            </p>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  )
} 