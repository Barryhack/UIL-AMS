import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams?.error || "An error occurred during authentication"

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "You do not have permission to access this resource."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "CredentialsSignin":
        return "Invalid email or password."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>

        <Button asChild>
          <Link href="/auth/login">
            Try Again
          </Link>
        </Button>

        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link 
            href="/" 
            className="hover:text-brand underline underline-offset-4"
          >
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
} 