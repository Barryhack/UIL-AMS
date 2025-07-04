"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Cpu,
  BarChart,
  Settings,
  Users,
  Bell,
  Calendar,
  Home,
  Fingerprint,
  BookOpenCheck,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type UserRole = "ADMIN" | "LECTURER" | "STUDENT"

const adminLinks = [
  {
    group: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/schedule", label: "Schedules", icon: Calendar },
      { href: "/admin/devices", label: "Devices", icon: Fingerprint },
    ],
  },
  {
    group: "Monitoring",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

const lecturerLinks = [
  {
    group: "Teaching",
    items: [
      { href: "/lecturer/dashboard", label: "Dashboard", icon: Home },
      { href: "/lecturer/courses", label: "My Courses", icon: BookOpen },
      { href: "/lecturer/attendance", label: "Attendance", icon: UserCheck },
      { href: "/lecturer/schedule", label: "Schedule", icon: Calendar },
    ],
  },
  {
    group: "Analysis",
    items: [
      { href: "/lecturer/reports", label: "Reports", icon: BarChart },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/lecturer/settings", label: "Settings", icon: Settings },
    ],
  },
]

const studentLinks = [
  {
    group: "Academics",
    items: [
      { href: "/student/dashboard", label: "Dashboard", icon: Home },
      { href: "/student/courses", label: "My Courses", icon: BookOpen },
      { href: "/student/attendance", label: "My Attendance", icon: UserCheck },
      { href: "/student/schedule", label: "Schedule", icon: Calendar },
      { href: "/student/registration", label: "Course Registration", icon: BookOpenCheck },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/student/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function SidebarNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  // Determine user role from session
  const userRole = (session?.user as { role?: UserRole })?.role || "STUDENT"
  
  // Select links based on user role
  const links = userRole === "ADMIN" 
    ? adminLinks 
    : userRole === "LECTURER" 
    ? lecturerLinks 
    : studentLinks

  return (
    <nav className="space-y-4 py-4">
      {links.map((group) => (
        <div key={group.group} className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            {group.group}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
} 