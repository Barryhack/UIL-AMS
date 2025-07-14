import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { WebSocketProvider } from "@/lib/websocket-context"
import { Toaster } from "sonner"
import "@/styles/globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useEffect } from "react"
import { getHardwareService } from "@/lib/services/hardware-service"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UNILORIN AMS",
  description: "University of Ilorin Attendance Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const hardwareService = getHardwareService();
    hardwareService.connectWebSocket(() => {});
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </TooltipProvider>
            <Toaster />
          </WebSocketProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
