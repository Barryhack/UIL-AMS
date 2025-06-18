"use client"

import { useState } from "react"
import { UserRegistrationForm } from "@/components/forms/user-registration-form"

export default function RegisterPage() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add New User</h2>
      </div>
      <UserRegistrationForm
        open={isOpen}
        onClose={() => setIsOpen(false)}
              />
    </div>
  )
} 