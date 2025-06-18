import Image from "next/image"
import { cn } from "@/lib/utils"

interface UnilorinLogoProps {
  width?: number
  height?: number
  className?: string
}

export function UnilorinLogo({ width = 40, height = 40, className }: UnilorinLogoProps) {
  return (
    <div 
      className={cn("relative", className)}
      style={{ 
        width: width || "100%", 
        height: height || "100%",
      }}
    >
      <Image
        src="/images/unilorin-logo.png"
        alt="University of Ilorin Logo"
        fill
        priority
        className="object-contain"
        sizes={`(max-width: 768px) ${width}px, ${width}px`}
      />
    </div>
  )
}
