"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface RegisterCourseButtonProps {
  courseId: string
  isRegistered: boolean
}

export function RegisterCourseButton({
  courseId,
  isRegistered,
}: RegisterCourseButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRegistration = async () => {
    try {
      setIsLoading(true)
      const endpoint = isRegistered ? "/api/courses/deregister" : "/api/courses/register"
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      })

      if (!response.ok) {
        throw new Error("Failed to process registration")
      }

      toast.success(isRegistered ? "Course deregistered successfully" : "Course registered successfully")
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isRegistered ? "destructive" : "default"}
      size="sm"
      onClick={handleRegistration}
      disabled={isLoading}
    >
      {isLoading ? (
        "Processing..."
      ) : isRegistered ? (
        "Deregister"
      ) : (
        "Register"
      )}
    </Button>
  )
} 