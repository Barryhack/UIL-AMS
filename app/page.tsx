"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/login")
      return
    }

    // Redirect based on user role
    switch (session?.user?.role) {
      case "ADMIN":
        router.push("/admin/dashboard")
        break
      case "STUDENT":
        router.push("/student/dashboard")
        break
      case "LECTURER":
        router.push("/lecturer/dashboard")
        break
      default:
        router.push("/auth/login")
    }
  }, [session, status, router])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return null
} 