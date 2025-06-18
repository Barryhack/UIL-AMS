"use client"

import type React from "react"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ className, children, required, ...props }: LabelProps) {
  const classes = ["form-label", className].filter(Boolean).join(" ")

  return (
    <label className={classes} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}
