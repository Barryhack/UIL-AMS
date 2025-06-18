import Image from "next/image"

export function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="relative mb-4">
        <Image
          src="/unilorin-logo.png"
          alt="University of Ilorin"
          width={60}
          height={60}
          className="animate-pulse"
        />
        <div className="absolute inset-0 animate-spin-slow">
          <div className="h-full w-full rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
      <h2 className="text-lg font-medium text-muted-foreground">Loading...</h2>
    </div>
  )
} 