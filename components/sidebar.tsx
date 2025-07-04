"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Fingerprint,
  Settings,
  BarChart3,
  Bell,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Devices", href: "/admin/devices", icon: Fingerprint },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full flex-col bg-background border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="font-bold text-lg">UNILORIN AMS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 