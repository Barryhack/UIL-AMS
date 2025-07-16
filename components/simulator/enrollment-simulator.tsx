"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Fingerprint, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateMockFingerprintData, generateMockRfidData } from "@/lib/mock-biometrics"

interface EnrollmentSimulatorProps {
  userId: string
  userName: string
  onComplete: (data: { fingerprintId?: string; rfidUid?: string }) => void
  onCancel: () => void
}

export function EnrollmentSimulator({ userId, userName, onComplete, onCancel }: EnrollmentSimulatorProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"FINGERPRINT" | "RFID">("FINGERPRINT")
  const [isScanning, setIsScanning] = useState(false)
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)
  const [rfidData, setRfidData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    setIsScanning(true)
    setError(null)

    try {
      // Simulate scanning delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (activeTab === "FINGERPRINT") {
        // TODO: Replace with real fingerprint data fetching from hardware or API
        const realData = "" // fetch from real source
        setFingerprintData(realData)
        toast({
          title: "Fingerprint Captured",
          description: "Fingerprint scan completed successfully.",
        })
      } else {
        // TODO: Replace with real RFID data fetching from hardware or API
        const realData = "" // fetch from real source
        setRfidData(realData)
        toast({
          title: "RFID Captured",
          description: "RFID scan completed successfully.",
        })
      }
    } catch (error) {
      console.error("Error during scan:", error)
      setError("Failed to capture biometric data. Please try again.")
      toast({
        title: "Error",
        description: "Failed to capture biometric data",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleComplete = async () => {
    if (!fingerprintData && !rfidData) {
      setError("At least one biometric method must be enrolled.")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real implementation, this would call the API
      // For now, we'll simulate a successful response
      const fingerprintId = fingerprintData ? `FP${Math.floor(100000 + Math.random() * 900000)}` : undefined
      const rfidUid = rfidData ? `RFID${Math.floor(10000000000 + Math.random() * 90000000000)}` : undefined

      toast({
        title: "Enrollment Complete",
        description: "Biometric data has been successfully enrolled.",
      })

      onComplete({ fingerprintId, rfidUid })
    } catch (error) {
      console.error("Error completing enrollment:", error)
      setError("Failed to complete enrollment. Please try again.")
      toast({
        title: "Error",
        description: "Failed to complete enrollment",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Biometric Enrollment Simulator</CardTitle>
        <CardDescription>Simulate biometric enrollment for {userName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="danger">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="FINGERPRINT">
              <Fingerprint className="mr-2 h-4 w-4" />
              Fingerprint
            </TabsTrigger>
            <TabsTrigger value="RFID">
              <CreditCard className="mr-2 h-4 w-4" />
              RFID
            </TabsTrigger>
          </TabsList>
          <TabsContent value="FINGERPRINT" className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className={`rounded-full p-8 ${fingerprintData ? "bg-green-100" : "bg-primary/10"}`}>
                <Fingerprint className={`h-16 w-16 ${fingerprintData ? "text-green-600" : "text-primary"}`} />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              {fingerprintData
                ? "Fingerprint successfully captured."
                : "Place your finger on the fingerprint scanner to enroll."}
            </p>
            <Button className="w-full" onClick={handleScan} disabled={isScanning || !!fingerprintData}>
              {isScanning && activeTab === "FINGERPRINT" ? (
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
                "Simulate Fingerprint Scan"
              )}
            </Button>
          </TabsContent>
          <TabsContent value="RFID" className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className={`rounded-full p-8 ${rfidData ? "bg-green-100" : "bg-blue-500/10"}`}>
                <CreditCard className={`h-16 w-16 ${rfidData ? "text-green-600" : "text-blue-500"}`} />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              {rfidData ? "RFID successfully captured." : "Place your RFID card on the reader to enroll."}
            </p>
            <Button className="w-full" onClick={handleScan} disabled={isScanning || !!rfidData}>
              {isScanning && activeTab === "RFID" ? (
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
                "Simulate RFID Scan"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isScanning}>
          Cancel
        </Button>
        <Button onClick={handleComplete} disabled={isScanning || (!fingerprintData && !rfidData)}>
          {isScanning && activeTab !== "FINGERPRINT" && activeTab !== "RFID" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Enrollment"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
