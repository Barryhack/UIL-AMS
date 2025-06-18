import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Redirect based on user role
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard")
    case "LECTURER":
      redirect("/lecturer/dashboard")
    case "STUDENT":
      redirect("/student/dashboard")
    default:
      redirect("/auth/login")
  }
} 