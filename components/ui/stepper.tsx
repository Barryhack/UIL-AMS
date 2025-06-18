import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  title: string
  description: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index
          const isCurrent = currentStep === index

          return (
            <div key={step.title} className="flex flex-1 flex-col items-center">
              <div className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? "rgb(34 197 94)" : isCurrent ? "rgb(59 130 246)" : "rgb(229 231 235)",
                    scale: isCurrent ? 1.2 : 1,
                  }}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-white"
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted ? "rgb(34 197 94)" : "rgb(229 231 235)",
                    }}
                    className="h-[2px] w-full flex-1"
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="mt-1 text-xs text-gray-500">{step.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 