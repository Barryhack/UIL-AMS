import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    return session?.user?.id || null
  } catch (error) {
    console.error("Error getting auth token:", error)
    return null
  }
}

export function getAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  return headers
} 