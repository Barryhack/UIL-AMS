import type React from "react"

interface BadgeProps {
  variant?: "primary" | "success" | "warning" | "danger"
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = "primary", className, children }: BadgeProps) {
  const variantClasses = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
  }

  const classes = ["badge", variantClasses[variant], className].filter(Boolean).join(" ")

  return <span className={classes}>{children}</span>
}
