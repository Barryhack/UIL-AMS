import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard overview",
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 