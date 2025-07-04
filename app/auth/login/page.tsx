"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { BackgroundGrid } from "@/components/ui/background-grid"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      // Redirect to dashboard - middleware will handle role-based routing
      router.push('/')
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <BackgroundGrid />
      
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
        <div className="w-full max-w-6xl h-full max-h-[90vh] bg-blue-50/50 rounded-[40px] shadow-2xl shadow-blue-500/10" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] p-4 relative"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-[80px] h-[80px] mx-auto mb-4"
          >
            <div className="relative w-full h-full bg-white/50 rounded-lg p-2">
              {!imageError ? (
                <Image
                  src="/images/unilorin-logo.png"
                  alt="University of Ilorin"
                  width={80}
                  height={80}
                  priority
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 rounded-full">
                  <span className="text-xl font-bold text-blue-500">UNIAMS</span>
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Welcome to UNIAMS
            </h1>
            <p className="text-sm text-gray-600">
              University of Ilorin Attendance Management System
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-center">Sign in to your account</CardTitle>
              <CardDescription className="text-center text-sm text-gray-600">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="danger" className="bg-red-50 text-red-600 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@unilorin.edu.ng"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                    className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Link 
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
} 