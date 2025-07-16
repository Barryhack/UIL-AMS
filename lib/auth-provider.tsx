"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for cached user data first to avoid delay
  useEffect(() => {
    const cachedUser = localStorage.getItem("user")
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
        setIsLoading(false)
      } catch (error) {
        console.error("Error parsing cached user:", error)
        localStorage.removeItem("user")
      }
    }

    // Then verify the token in the background
    verifyToken()
  }, [])

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }

      // Use a timeout to ensure the verification doesn't hang
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Verification timeout")), 3000),
      )

      const fetchPromise = fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Race between fetch and timeout
      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
      } else {
        // Clear invalid token
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setUser(null)
      }
    } catch (error) {
      console.error("Token verification error:", error)
      // If verification times out or fails, use cached user data if available
      const cachedUser = localStorage.getItem("user")
      if (!cachedUser) {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        return { success: true, message: "Login successful" }
      } else {
        return { success: false, message: data.error || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
