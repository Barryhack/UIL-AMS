"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Fingerprint, CreditCard, Loader2, WifiOff } from "lucide-react"
import { getHardwareService } from "@/lib/services/hardware-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWebSocketContext } from '@/lib/websocket-context';

interface HardwareScannerProps {
  onRFIDScanned?: (data: string) => void
  onFingerprintScanned?: (data: string) => void
  onFingerprintEnrolled?: (data: string) => void
  userId?: string
  mode: 'SCAN' | 'ENROLL'
  deviceId?: string
}

interface StatusUpdate {
  status: string
  message: string
}

export function HardwareScanner({
  onRFIDScanned,
  onFingerprintScanned,
  onFingerprintEnrolled,
  userId,
  mode,
  deviceId
}: HardwareScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [service, setService] = useState<any>(null)
  const { getDeviceStatus } = useWebSocketContext();
  const isConnected = deviceId ? getDeviceStatus(deviceId) === 'online' : false;

  console.log('HardwareScanner render', { mode, isConnected, isScanning, userId, deviceId });

  // Initialize service only on client side
  useEffect(() => {
    try {
      const hardwareService = getHardwareService()
      setService(hardwareService)
    } catch (error) {
      console.error('Failed to initialize hardware service:', error)
      setError('Hardware service not available')
    }
  }, [])

  const startFingerprint = useCallback(async () => {
    console.log('startFingerprint called', { mode, isConnected, userId, deviceId });
    if (!service) {
      setError('Hardware service not available')
      return
    }
    
    try {
      setIsScanning(true)
      setError(null)
      
      if (!isConnected) {
        throw new Error('Device not connected. Please check the hardware connection.')
      }

      if (mode === 'ENROLL' && userId) {
        console.log('Calling enrollFingerprint', { userId, deviceId });
        await service.enrollFingerprint(deviceId, userId)
      } else {
        console.log('Calling scanFingerprint', { userId, deviceId });
        await service.scanFingerprint(userId || "", deviceId)
      }
    } catch (error) {
      setIsScanning(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start fingerprint scan'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [mode, userId, deviceId, service, isConnected]);

  // Remove isConnected effect and all setIsConnected calls

  const startRFID = async () => {
    if (!service) {
      setError('Hardware service not available')
      return
    }
    
    try {
      setIsScanning(true)
      setError(null)

      if (!isConnected) {
        throw new Error('Device not connected. Please check the hardware connection.')
      }

      await service.scanRFID(deviceId)
    } catch (error) {
      setIsScanning(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start RFID scan'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  if (!service) {
    return (
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-500">Initializing Hardware Service</h3>
              <p className="text-sm text-gray-500">
                Please wait while the hardware service is being initialized.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <WifiOff className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-500">Device Not Connected</h3>
              <p className="text-sm text-gray-500">
                Please check that the hardware device is powered on and connected to the network.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        {error && (
          <Alert variant="danger" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium">
              {mode === 'ENROLL' ? 'Enroll New User' : 'Scan Hardware'}
            </h3>
            <p className="text-sm text-gray-500">
              {scanStatus || (isScanning ? 'Scanning...' : 'Ready to scan')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              onClick={startFingerprint}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'ENROLL' ? 'Enrolling...' : 'Scanning...'}
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {mode === 'ENROLL' ? 'Enrollment Starting...' : 'Scan Fingerprint'}
                </>
              )}
            </Button>

            <Button
              onClick={startRFID}
              disabled={isScanning || mode === 'ENROLL'}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Scan RFID
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
