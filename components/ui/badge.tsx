import type React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  variant?: "primary" | "success" | "warning" | "danger"
  className?: string
  children: React.ReactNode
}

const badgeVariants = {
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
}

export function Badge({ variant = "primary", className, children }: BadgeProps) {
  const classes = cn("badge", badgeVariants[variant], className)

  return <span className={classes}>{children}</span>
}

export { badgeVariants }
