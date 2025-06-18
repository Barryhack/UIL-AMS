"use client"

import { UserNav } from "@/components/user-nav"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { UnilorinLogo } from "@/components/ui/unilorin-logo"
import { cn } from "@/lib/utils"
import { Search, Bell, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"

type UserRole = "ADMIN" | "LECTURER" | "STUDENT"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance for sidebar gesture (in px)
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && !isSidebarCollapsed) {
      setSidebarCollapsed(true)
    } else if (isRightSwipe && isSidebarCollapsed) {
      setSidebarCollapsed(false)
    }
    
    setTouchEnd(null)
    setTouchStart(null)
  }, [touchStart, touchEnd, isSidebarCollapsed])

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
      // Auto-collapse sidebar on smaller screens
      setSidebarCollapsed(window.innerWidth < 1280)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [pathname, isMobile])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const basePath = `/${userRole.toLowerCase()}`
  const sidebarWidth = isSidebarCollapsed ? "w-16" : "w-64"
  const mainContentMargin = isMobile ? (isSidebarCollapsed ? "ml-16" : "ml-0") : "ml-0"

  return (
    <div 
      className="fixed inset-0 flex bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Menu Button */}
      <button
        className={cn(
          "lg:hidden fixed z-[60] p-2 rounded-lg transition-all duration-200",
          "hover:bg-accent active:scale-95",
          isSidebarCollapsed
            ? "left-[calc(4rem-3rem)] top-3 bg-background/80 backdrop-blur border"
            : "left-4 top-3 bg-primary text-primary-foreground shadow-lg"
        )}
        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
        aria-label={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r bg-[hsl(var(--sidebar-background))]",
          "lg:relative lg:translate-x-0",
          "transition-all duration-300 ease-in-out",
          isMobile && "fixed inset-y-0 left-0 z-50",
          sidebarWidth,
          isSidebarCollapsed ? "shadow-sm" : "shadow-xl"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-[hsl(var(--sidebar-border))]",
          "relative z-50 bg-[hsl(var(--sidebar-background))]",
          isSidebarCollapsed ? "px-2 justify-center" : "px-4"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            !isSidebarCollapsed && "w-full"
          )}>
            <div className="flex-shrink-0 relative z-50">
              <UnilorinLogo 
                width={isSidebarCollapsed ? 28 : 32} 
                height={isSidebarCollapsed ? 28 : 32}
                className="relative z-50"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <h2 className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] truncate">UNILORIN AMS</h2>
                <span className="text-xs text-[hsl(var(--sidebar-accent-foreground))] capitalize truncate">
                  {userRole.toLowerCase()} Portal
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <SidebarNav collapsed={isSidebarCollapsed} role={userRole} />
          </div>
          <div className="shrink-0 p-4 border-t border-[hsl(var(--sidebar-border))]">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              {isSidebarCollapsed ? "Exit" : "Logout"}
            </Button>
          </div>
        </div>

        {/* Collapse Toggle Button - Only show on desktop */}
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "absolute -right-3 top-20 p-1.5 rounded-full",
              "bg-background border shadow-sm",
              "hover:bg-accent active:scale-95",
              "transition-all duration-200 z-50"
            )}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[margin] duration-300",
          mainContentMargin
        )}
      >
        {/* Top Navigation Bar */}
        <header className="shrink-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center justify-center flex-1 gap-4">
              <form onSubmit={handleSearch} className="relative max-w-full md:w-96">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search"
                  placeholder="Search..." 
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <nav className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => router.push(`${basePath}/notifications`)}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                    3
                  </span>
                </Button>
              </nav>
            </div>
            <div className="flex items-center justify-end gap-2">
              <UserNav />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay - Only show when sidebar is expanded */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}
    </div>
  )
} 