"use client"

import { useState } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { UserCircle, Mail, Building2, GraduationCap } from "lucide-react"

export default function StudentSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const currentPassword = formData.get("currentPassword")
      const newPassword = formData.get("newPassword")
      const confirmPassword = formData.get("confirmPassword")

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match")
      }

      if (typeof newPassword === "string" && newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long")
      }

      const response = await fetch("/api/student/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      toast.success("Password changed successfully")
      event.currentTarget.reset()
    } catch (error) {
      console.error("Password change error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground">Update your account password</p>
        
        <Separator className="my-6" />
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </Card>
    </div>
  )
} 