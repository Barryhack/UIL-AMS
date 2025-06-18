import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mb-8">
        <Image
          src="/unilorin-logo.png"
          alt="University of Ilorin"
          width={80}
          height={80}
          className="opacity-50"
        />
      </div>
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-2 text-xl font-semibold">Page not found</p>
      <p className="mb-8 text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  )
} 