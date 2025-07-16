"use client"

export const dynamic = "force-dynamic";

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("HomePage useEffect triggered", { 
      status, 
      hasSession: !!session, 
      userRole: session?.user?.role,
      pathname: window.location.pathname 
    })
    
    if (status === "loading") return

    if (!session) {
      console.log("No session, redirecting to login")
      router.push("/auth/login")
      return
    }

    // Redirect based on user role
    switch (session?.user?.role) {
      case "ADMIN":
        console.log("Redirecting admin to dashboard")
        router.push("/admin/dashboard")
        break
      case "STUDENT":
        console.log("Redirecting student to dashboard")
        router.push("/student/dashboard")
        break
      case "LECTURER":
        console.log("Redirecting lecturer to dashboard")
        router.push("/lecturer/dashboard")
        break
      default:
        console.log("Unknown role, redirecting to login")
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