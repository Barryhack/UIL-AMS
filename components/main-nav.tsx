"use client"

import { useSession } from "next-auth/react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function MainNav() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "STUDENT"

  return (
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {session?.user?.name || "Guest"}
        </span>
        <span className="text-xs text-muted-foreground">
          {userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()}
        </span>
      </div>
    </div>
  )
} 