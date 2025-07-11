"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, GraduationCap, UserCheck } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: any
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/student",
    icon: GraduationCap
  },
  {
    title: "Courses",
    href: "/student/courses",
    icon: BookOpen
  },
  {
    title: "Attendance",
    href: "/student/attendance",
    icon: UserCheck
  }
]

export function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) => {
        const Icon = item.icon
        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent" : "transparent"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
} 