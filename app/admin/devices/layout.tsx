import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devices Management",
  description: "Manage and monitor attendance devices",
}

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 