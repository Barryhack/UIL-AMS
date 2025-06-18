import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics",
  description: "View system analytics and statistics",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 