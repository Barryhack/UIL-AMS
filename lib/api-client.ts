"use client"

import { getAuthToken } from "./auth-utils"

interface FetchOptions extends RequestInit {
  auth?: boolean
}

export async function apiFetch<T = any>(url: string, options: FetchOptions = { auth: true }): Promise<T> {
  const { auth = true, ...fetchOptions } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  }

  // Add auth token if required and available
  if (auth) {
    const token = getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    // If we're in the browser, redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  // Handle other error responses
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "An error occurred")
  }

  // Parse JSON response
  return response.json()
}
