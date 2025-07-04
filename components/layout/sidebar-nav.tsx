"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  BarChart,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Home,
  Settings,
  Users,
  Bell,
  Laptop,
  BookOpenCheck,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type UserRole = "ADMIN" | "LECTURER" | "STUDENT"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  role?: UserRole
  collapsed?: boolean
}

export function SidebarNav({ className, role, collapsed, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  // Define navigation items based on user role
  const getNavItems = () => {
    switch (role) {
      case "ADMIN":
        return [
          {
            href: "/admin/dashboard",
            title: "Overview",
            icon: <Home className="h-4 w-4" />,
          },
          {
            href: "/admin/analytics",
            title: "Analytics",
            icon: <BarChart className="h-4 w-4" />,
          },
          {
            href: "/admin/users",
            title: "Users",
            icon: <FileText className="h-4 w-4" />,
          },
          {
            href: "/admin/courses",
            title: "Courses",
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            href: "/admin/schedule",
            title: "Schedules",
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            href: "/admin/devices",
            title: "Devices",
            icon: <Laptop className="h-4 w-4" />,
          },
          {
            href: "/admin/reports",
            title: "Reports",
            icon: <FileText className="h-4 w-4" />,
          },
          {
            href: "/admin/notifications",
            title: "Notifications",
            icon: <Bell className="h-4 w-4" />,
          },
          {
            href: "/admin/settings",
            title: "Settings",
            icon: <Settings className="h-4 w-4" />,
          },
        ]
      case "LECTURER":
        return [
          {
            href: "/lecturer/dashboard",
            title: "Overview",
            icon: <Home className="h-4 w-4" />,
          },
          {
            href: "/lecturer/courses",
            title: "My Courses",
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            href: "/lecturer/attendance",
            title: "Attendance",
            icon: <ClipboardList className="h-4 w-4" />,
          },
          {
            href: "/lecturer/schedule",
            title: "Schedule",
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            href: "/lecturer/reports",
            title: "Reports",
            icon: <FileText className="h-4 w-4" />,
          },
        ]
      case "STUDENT":
        return [
          {
            href: "/student/dashboard",
            title: "Overview",
            icon: <Home className="h-4 w-4" />,
          },
          {
            href: "/student/courses",
            title: "My Courses",
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            href: "/student/registration",
            title: "Course Registration",
            icon: <BookOpenCheck className="h-4 w-4" />,
          },
          {
            href: "/student/attendance",
            title: "Attendance",
            icon: <ClipboardList className="h-4 w-4" />,
          },
          {
            href: "/student/schedule",
            title: "Schedule",
            icon: <Calendar className="h-4 w-4" />,
          },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.href
    const link = (
      <Link
        href={item.href}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          pathname === item.href
            ? "bg-muted hover:bg-muted"
            : "hover:bg-transparent hover:underline",
          "justify-start gap-2",
          collapsed && "w-10 px-0 justify-center"
        )}
      >
        {React.cloneElement(item.icon, {
          className: cn(
            "h-4 w-4",
            collapsed ? "mx-auto" : "mr-2"
          )
        })}
        {!collapsed && item.title}
      </Link>
    )

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {link}
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return link
  }

  return (
    <nav
      className={cn(
        "flex flex-col space-y-1 p-4",
        collapsed && "items-center px-2",
        className
      )}
      {...props}
    >
      {navItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  )
} 