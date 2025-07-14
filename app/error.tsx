"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mb-8">
        <Image
          src="/images/unilorin-logo.png"
          alt="University of Ilorin"
          width={80}
          height={80}
          className="opacity-50"
        />
      </div>
      <h1 className="mb-2 text-4xl font-bold">Something went wrong!</h1>
      <p className="mb-8 text-muted-foreground">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Go home
        </Button>
      </div>
    </div>
  )
} 