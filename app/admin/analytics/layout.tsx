"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  return (
    <DashboardLayout userRole="ADMIN">
      {children}
    </DashboardLayout>
  )
} 