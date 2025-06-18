"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Fingerprint, CreditCard, Loader2, WifiOff } from "lucide-react"
import { getHardwareService } from "@/lib/services/hardware-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HardwareScannerProps {
  onRFIDScanned?: (data: string) => void
  onFingerprintScanned?: (data: string) => void
  onFingerprintEnrolled?: (data: string) => void
  userId?: number
  mode: 'SCAN' | 'ENROLL'
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
  mode
}: HardwareScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [service] = useState(() => getHardwareService())

  useEffect(() => {
    // Check initial connection status
    const isConnected = service.isConnected()
    setIsConnected(isConnected)
    
    if (!isConnected) {
      setError('Device not connected. Please check the hardware connection.')
    }

    const handleConnect = () => {
      console.log('Hardware connected')
      setIsConnected(true)
      setError(null)
    }

    const handleDisconnect = () => {
      console.log('Hardware disconnected')
      setIsConnected(false)
      setError('Device disconnected. Please check the hardware connection.')
      setIsScanning(false)
    }

    const handleStatusUpdate = (status: StatusUpdate) => {
      console.log('Status update:', status)
      setScanStatus(status.message)
      
      switch (status.status) {
        case 'error':
          setError(status.message)
          setIsScanning(false)
          toast.error(status.message)
          break
        case 'connected':
          setIsConnected(true)
          setError(null)
          toast.success(status.message)
          break
        case 'disconnected':
          setIsConnected(false)
          setError(status.message)
          setIsScanning(false)
          toast.error(status.message)
          break
        case 'connecting':
        case 'reconnecting':
          setIsConnected(false)
          setError(null)
          setScanStatus(status.message)
          break
        default:
          setScanStatus(status.message)
      }
    }

    const handleScanComplete = (result: any) => {
      console.log('Scan complete:', result)
      setIsScanning(false)
      setScanStatus('')
      setError(null)

      if (result.success) {
        if (result.fingerprintId !== undefined) {
          if (mode === 'ENROLL') {
            onFingerprintEnrolled?.(String(result.fingerprintId))
          } else {
            onFingerprintScanned?.(String(result.fingerprintId))
          }
          toast.success('Fingerprint scan completed')
        } else if (result.cardId) {
          onRFIDScanned?.(result.cardId)
          toast.success('RFID card scanned')
        }
      } else {
        const errorMessage = result.error || 'Scan failed'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    }

    // Set up event listeners
    service.on('connected', handleConnect)
    service.on('disconnected', handleDisconnect)
    service.on('statusUpdate', handleStatusUpdate)
    service.on('scanComplete', handleScanComplete)

    // Try to connect if not connected
    if (!isConnected) {
      service.testConnection()
    }

    return () => {
      // Clean up event listeners
      service.removeListener('connected', handleConnect)
      service.removeListener('disconnected', handleDisconnect)
      service.removeListener('statusUpdate', handleStatusUpdate)
      service.removeListener('scanComplete', handleScanComplete)
    }
  }, [mode, onRFIDScanned, onFingerprintScanned, onFingerprintEnrolled, service])

  const startFingerprint = async () => {
    try {
      setIsScanning(true)
      setError(null)
      
      if (!isConnected) {
        throw new Error('Device not connected. Please check the hardware connection.')
      }

      if (mode === 'ENROLL' && userId) {
        await service.enrollFingerprint(userId)
      } else {
        await service.scanFingerprint(userId || 0)
      }
    } catch (error) {
      setIsScanning(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start fingerprint scan'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const startRFID = async () => {
    try {
      setIsScanning(true)
      setError(null)

      if (!isConnected) {
        throw new Error('Device not connected. Please check the hardware connection.')
      }

      await service.scanRFID()
    } catch (error) {
      setIsScanning(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start RFID scan'
      setError(errorMessage)
      toast.error(errorMessage)
    }
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
                  Scanning...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {mode === 'ENROLL' ? 'Enroll Fingerprint' : 'Scan Fingerprint'}
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
