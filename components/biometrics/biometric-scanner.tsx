import { useState, useEffect, useCallback } from "react";
import { Fingerprint, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getHardwareService } from "@/lib/services/hardware-service";
import { useWebSocketContext } from '@/lib/websocket-context';

interface BiometricScannerProps {
  userId: string;
  userName: string;
  onComplete: (data: { fingerprintData?: string; rfidData?: string }) => void;
  onCancel: () => void;
}

export function BiometricScanner({ userId, userName, onComplete, onCancel }: BiometricScannerProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "fingerprint" | "rfid" | "complete">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);
  const [rfidData, setRfidData] = useState<string | null>(null);
  const [service, setService] = useState<any>(null);
  const { getDeviceStatus, lastScanEvent } = useWebSocketContext();
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const deviceId = "UNILORIN_AMS_1"; // TODO: Make this dynamic if needed
  const isConnected = getDeviceStatus(deviceId) === 'online';

  useEffect(() => {
    setService(getHardwareService());
  }, []);

  // Listen for scan events from WebSocket
  useEffect(() => {
    if (!lastScanEvent) return;
    if (step === "fingerprint" && lastScanEvent.scanType === "fingerprint") {
      setFingerprintData(lastScanEvent.data);
      setIsLoading(false);
      setStep("idle");
      toast({ title: "Fingerprint captured", description: "Fingerprint scan completed successfully." });
      if (scanTimeout) clearTimeout(scanTimeout);
    }
    if (step === "rfid" && lastScanEvent.scanType === "rfid") {
      setRfidData(lastScanEvent.data);
      setIsLoading(false);
      setStep("idle");
      toast({ title: "RFID captured", description: "RFID scan completed successfully." });
      if (scanTimeout) clearTimeout(scanTimeout);
    }
  }, [lastScanEvent, step, toast, scanTimeout]);

  // Timeout for scan
  const startScanTimeout = () => {
    if (scanTimeout) clearTimeout(scanTimeout);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setStep("idle");
      setError("Scan timed out. Please try again.");
    }, 15000);
    setScanTimeout(timeout);
  };

  const startFingerprintScan = useCallback(async () => {
    setStep("fingerprint");
    setIsLoading(true);
    setError(null);
    startScanTimeout();
    try {
      await service?.scanFingerprint(userId, deviceId);
    } catch (err) {
      setError("Failed to start fingerprint scan. Please try again.");
      setIsLoading(false);
      setStep("idle");
    }
  }, [service, userId, deviceId]);

  const startRfidScan = useCallback(async () => {
    setStep("rfid");
    setIsLoading(true);
    setError(null);
    startScanTimeout();
    try {
      await service?.scanRFID(deviceId);
    } catch (err) {
      setError("Failed to start RFID scan. Please try again.");
      setIsLoading(false);
      setStep("idle");
    }
  }, [service, deviceId]);

  const handleComplete = async () => {
    if (!fingerprintData && !rfidData) {
      setError("At least one biometric method must be enrolled.");
      return;
    }
    setIsLoading(true);
    setError(null);
    onComplete({ fingerprintData: fingerprintData || undefined, rfidData: rfidData || undefined });
    setStep("complete");
    setIsLoading(false);
  };

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
                  disabled={isLoading || !!fingerprintData || step === "rfid" || !isConnected}
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
                  disabled={isLoading || !!rfidData || step === "fingerprint" || !isConnected}
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
          onClick={handleComplete}
          disabled={isLoading || (!fingerprintData && !rfidData) || step === "complete"}
        >
          {isLoading && step !== "fingerprint" && step !== "rfid" ? (
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
  );
} 