"use client"

import { useState } from "react"
import { Fingerprint, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface EnrollmentFormProps {
  userId: string
  userName: string
  onComplete: () => void
  onCancel: () => void
}

export function BiometricEnrollmentForm({ userId, userName, onComplete, onCancel }: EnrollmentFormProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"idle" | "fingerprint" | "rfid" | "complete">("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)
  const [rfidData, setRfidData] = useState<string | null>(null)

  // In a real implementation, these functions would communicate with the ESP32 device
  // to capture fingerprint and RFID data
  const startFingerprintScan = async () => {
    setStep("fingerprint")
    setIsLoading(true)
    setError(null)

    try {
      // Simulate fingerprint scanning
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // In a real implementation, this would be the data from the fingerprint scanner
      const mockFingerprintData = "FINGERPRINT_DATA_" + Math.floor(100000 + Math.random() * 900000)
      setFingerprintData(mockFingerprintData)

      toast({
        title: "Fingerprint captured",
        description: "Fingerprint scan completed successfully.",
      })

      setIsLoading(false)
    } catch (err) {
      setError("Failed to capture fingerprint. Please try again.")
      setIsLoading(false)
    }
  }

  const startRfidScan = async () => {
    setStep("rfid")
    setIsLoading(true)
    setError(null)

    try {
      // Simulate RFID scanning
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real implementation, this would be the data from the RFID reader
      const mockRfidData = "RFID_" + Math.floor(1000000000 + Math.random() * 9000000000)
      setRfidData(mockRfidData)

      toast({
        title: "RFID captured",
        description: "RFID scan completed successfully.",
      })

      setIsLoading(false)
    } catch (err) {
      setError("Failed to capture RFID. Please try again.")
      setIsLoading(false)
    }
  }

  const completeEnrollment = async () => {
    if (!fingerprintData && !rfidData) {
      setError("At least one biometric method must be enrolled.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/biometrics/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          fingerprintData,
          rfidData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to enroll biometrics")
      }

      toast({
        title: "Enrollment complete",
        description: "Biometric data has been successfully enrolled.",
      })

      setStep("complete")
      setIsLoading(false)

      // Wait a moment before calling onComplete
      setTimeout(onComplete, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll biometrics")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Biometric Enrollment</CardTitle>
        <CardDescription>Register biometric data for {userName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="danger">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "complete" ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Enrollment Complete</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Biometric data has been successfully registered for {userName}.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Fingerprint className={`h-12 w-12 ${fingerprintData ? "text-green-600" : "text-primary"}`} />
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-medium">Fingerprint Registration</h3>
                <p className="text-sm text-muted-foreground">
                  {fingerprintData
                    ? "Fingerprint successfully captured."
                    : "Place the user's finger on the fingerprint scanner."}
                </p>
                <Button
                  className="w-full"
                  onClick={startFingerprintScan}
                  disabled={isLoading || !!fingerprintData || step === "rfid"}
                >
                  {isLoading && step === "fingerprint" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : fingerprintData ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Captured
                    </>
                  ) : (
                    "Start Fingerprint Scan"
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-blue-500/10 p-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={rfidData ? "text-green-600" : "text-blue-500"}
                  >
                    <path d="M2 14a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2z" />
                    <path d="M2 14v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6" />
                    <path d="M6 10h4" />
                    <path d="M6 6h8" />
                  </svg>
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-medium">RFID Registration</h3>
                <p className="text-sm text-muted-foreground">
                  {rfidData
                    ? "RFID successfully captured."
                    : "Place the RFID card/tag on the RFID reader to register it."}
                </p>
                <Button
                  className="w-full"
                  variant={rfidData ? "default" : "outline"}
                  onClick={startRfidScan}
                  disabled={isLoading || !!rfidData || step === "fingerprint"}
                >
                  {isLoading && step === "rfid" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : rfidData ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Captured
                    </>
                  ) : (
                    "Start RFID Scan"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading || step === "complete"}>
          Cancel
        </Button>
        <Button
          onClick={completeEnrollment}
          disabled={isLoading || (!fingerprintData && !rfidData) || step === "complete"}
        >
          {isLoading && step !== "fingerprint" && step !== "rfid" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
