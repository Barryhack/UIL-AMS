"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Sidebar } from "./sidebar"

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-[60px] border-b bg-white dark:bg-gray-800 flex items-center justify-between px-4 lg:hidden z-50">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              fill
              alt="Logo"
              src="/images/unilorin-logo.png"
              className="object-contain"
            />
          </div>
          <span className="font-bold text-xl">UNILORIN AMS</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600/75" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  )
} 