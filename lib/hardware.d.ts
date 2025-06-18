import { EventEmitter } from 'events'

export type DeviceType = 'FINGERPRINT' | 'RFID' | 'HYBRID'
export type DeviceStatus = 'CONNECTED' | 'DISCONNECTED' | 'BUSY' | 'ERROR'
export type ScanType = 'FINGERPRINT' | 'RFID'

export interface DeviceInfo {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  ipAddress: string
  macAddress: string
}

export interface ScanResult {
  success: boolean
  data?: string
  error?: string
  fingerprintId?: number
  message?: string
}

export interface StatusUpdate {
  status: string
  message: string
}

declare class HardwareService extends EventEmitter {
  static getInstance(): HardwareService
  startScan(scanType: ScanType, userId?: number): Promise<void>
  enrollFingerprint(userId: number): Promise<void>
  getDeviceInfo(): DeviceInfo
  isConnected(): boolean
  
  on(event: 'connected', listener: (deviceInfo: DeviceInfo) => void): this
  on(event: 'disconnected', listener: () => void): this
  on(event: 'error', listener: (error: Error) => void): this
  on(event: 'scanComplete', listener: (result: ScanResult) => void): this
  on(event: 'statusUpdate', listener: (status: StatusUpdate) => void): this
}

export const hardwareService: HardwareService 