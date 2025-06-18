"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthCheck() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")

    if (!token) {
      router.push("/login")
      return
    }

    // Verify the token
    fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid token")
        }
      })
      .catch(() => {
        localStorage.removeItem("authToken")
        router.push("/login")
      })
  }, [router])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Verifying authentication...</p>
      </div>
    </div>
  )
}
