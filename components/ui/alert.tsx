import type React from "react"

interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger"
  className?: string
  children: React.ReactNode
}

export function Alert({ variant = "info", className, children }: AlertProps) {
  const variantClasses = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    danger: "alert-danger",
  }

  const classes = ["alert", variantClasses[variant], className].filter(Boolean).join(" ")

  return (
    <div className={classes} role="alert">
      {children}
    </div>
  )
}

interface AlertTitleProps {
  className?: string
  children: React.ReactNode
}

export function AlertTitle({ className, children }: AlertTitleProps) {
  const classes = ["alert-title", className].filter(Boolean).join(" ")
  return <h5 className={classes}>{children}</h5>
}

interface AlertDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function AlertDescription({ className, children }: AlertDescriptionProps) {
  const classes = ["alert-description", className].filter(Boolean).join(" ")
  return <div className={classes}>{children}</div>
}
