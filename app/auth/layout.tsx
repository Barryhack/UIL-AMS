"use client"

import { UnilorinLogo } from "@/components/ui/unilorin-logo"
import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 overflow-hidden lg:grid-cols-2">
      <div className="relative flex h-full min-h-screen flex-col bg-muted p-10 text-white">
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <Image
              src="/images/login-bg.jpg"
              alt="UNILORIN Campus"
              fill
              priority
              style={{ objectFit: "cover" }}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/90 to-green-950/90" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_500px_at_50%_200px,#4ade8020,transparent)]" />
          </div>
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="relative w-12 h-12 bg-white rounded-full overflow-hidden">
            <UnilorinLogo />
          </div>
          <span className="text-white text-xl ml-3 font-bold">UNILORIN AMS</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium leading-relaxed">
              &ldquo;Streamlining attendance management for better academic outcomes.&rdquo;
            </p>
            <footer className="text-sm text-green-100">University of Ilorin</footer>
          </blockquote>
        </div>
      </div>
      <div className="relative flex-1 min-h-screen flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-green-50 to-white opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#4ade8005,transparent)]" />
        <div className="relative w-full max-w-sm mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
} 