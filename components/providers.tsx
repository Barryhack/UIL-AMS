"use client"

import { SessionProvider } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </TooltipProvider>
  )
} 