import { redirect } from "next/navigation"
import { signOut } from "next-auth/react"

export default async function SignOutPage() {
  redirect("/api/auth/signout")
} 