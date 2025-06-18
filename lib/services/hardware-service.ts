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
  cardId?: string
  message?: string
}

export interface StatusUpdate {
  status: string
  message: string
}

class HardwareServiceImpl extends EventEmitter {
  private ws: WebSocket | null = null
  private deviceInfo: DeviceInfo = {
    id: '1',
    name: 'ESP32 Controller',
    type: 'HYBRID',
    status: 'DISCONNECTED',
    ipAddress: '192.168.4.1', // Default ESP32 AP IP
    macAddress: '5C:01:3B:4D:F8:08'
  }
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private scanTimeout = 30000
  private connectionCheckInterval: NodeJS.Timeout | null = null
  private isReconnecting = false
  private isDisconnecting = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private lastError: string | null = null
  private ports = [80, 81] // Common ESP32 WebSocket ports
  private currentPortIndex = 0

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      this.initializeConnection()
    }
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private clearConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
  }

  private startConnectionCheck() {
    this.clearConnectionCheck()

    // Check connection status every 5 seconds
    this.connectionCheckInterval = setInterval(() => {
      if (!this.isConnected() && !this.isReconnecting && !this.isDisconnecting) {
        console.log('Connection check failed, attempting to reconnect...')
        this.initializeConnection()
      }
    }, 5000)
  }

  private async initializeConnection() {
    if (this.isReconnecting || this.isDisconnecting) {
      return
    }

    this.isReconnecting = true
    this.clearReconnectTimeout()

    try {
      console.log('Initializing connection to hardware device...')
      this.emit('statusUpdate', { 
        status: 'connecting',
        message: 'Looking for ESP32 device...\nPlease make sure:\n1. ESP32 is powered on\n2. Connect to UnilorinAMS WiFi network (password: 12345678)' 
      })

      const connected = await this.connect()
      if (!connected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`)
        this.emit('statusUpdate', { 
          status: 'reconnecting',
          message: `Connection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}\nMake sure you're connected to UnilorinAMS WiFi` 
        })
        
        this.clearReconnectTimeout()
        this.reconnectTimeout = setTimeout(() => {
          this.isReconnecting = false
          this.initializeConnection()
        }, this.reconnectDelay)
      } else if (!connected) {
        console.log('Max reconnection attempts reached')
        this.emit('statusUpdate', { 
          status: 'error',
          message: 'Could not connect to ESP32.\nPlease check:\n1. ESP32 is powered on (LED should be on)\n2. You are connected to UnilorinAMS WiFi\n3. Try power cycling the ESP32' 
        })
        this.isReconnecting = false
        this.clearConnectionCheck()
      } else {
        this.isReconnecting = false
        this.reconnectAttempts = 0
        this.startConnectionCheck()
      }
    } catch (error) {
      console.error('Failed to initialize connection:', error)
      this.emit('statusUpdate', { 
        status: 'error',
        message: 'Connection failed. Please check:\n1. ESP32 is powered on\n2. Connect to UnilorinAMS WiFi network' 
      })
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        this.clearReconnectTimeout()
        this.reconnectTimeout = setTimeout(() => {
          this.isReconnecting = false
          this.initializeConnection()
        }, this.reconnectDelay)
      } else {
        this.isReconnecting = false
        this.clearConnectionCheck()
      }
    }
  }

  disconnect(): void {
    try {
      this.isDisconnecting = true
      this.clearReconnectTimeout()
      this.clearConnectionCheck()

      if (this.ws) {
        // Remove all existing listeners before closing
        this.ws.onclose = null
        this.ws.onerror = null
        this.ws.onmessage = null
        this.ws.onopen = null

        // Close the connection
        this.ws.close()
        this.ws = null
        this.deviceInfo.status = 'DISCONNECTED'
        
        // Emit disconnected event and status update
        this.emit('disconnected')
        this.emit('statusUpdate', { 
          status: 'disconnected',
          message: 'Disconnected from hardware device' 
        })
      }
    } catch (error) {
      console.error('Error during disconnect:', error)
      this.emit('statusUpdate', { 
        status: 'error',
        message: 'Error during disconnect' 
      })
    } finally {
      this.isDisconnecting = false
      this.reconnectAttempts = 0
    }
  }

  private async testDeviceConnection(ip: string, port: number): Promise<boolean> {
    try {
      // Try WebSocket connection directly without HTTP test
      const ws = new WebSocket(`ws://${ip}:${port}/ws`)
      
      return await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close()
          resolve(false)
        }, 2000)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
    } catch (error) {
      console.log(`Connection test failed for ${ip}:${port}:`, error)
      return false
    }
  }

  async connect(serverUrl?: string): Promise<boolean> {
    if (this.isDisconnecting) {
      return false
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('Connection already in progress')
      return false
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return true
    }

    if (this.ws) {
      this.disconnect()
    }

    try {
      const ip = this.deviceInfo.ipAddress
      const port = this.ports[this.currentPortIndex]
      const wsUrl = serverUrl || `ws://${ip}:${port}/ws`
      
      console.log(`Attempting connection to ${wsUrl} (Port ${port})`)
      
      this.emit('statusUpdate', { 
        status: 'connecting',
        message: `Trying to connect to ESP32 on port ${port}...\nMake sure you're connected to UnilorinAMS WiFi` 
      })

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl)
      
      const connected = await new Promise<boolean>((resolve) => {
        if (!this.ws) {
          resolve(false)
          return
        }

        const timeout = setTimeout(() => {
          console.log(`Connection timeout for ${wsUrl}`)
          if (this.ws && !this.isDisconnecting) {
            this.lastError = `Connection timeout on port ${port}`
            this.disconnect()
          }
          resolve(false)
        }, 3000) // 3 second timeout per attempt

        this.ws.onopen = () => {
          clearTimeout(timeout)
          console.log(`Successfully connected to ESP32 at ${wsUrl}`)
          this.reconnectAttempts = 0
          this.deviceInfo.status = 'CONNECTED'
          this.lastError = null
          this.currentPortIndex = 0
          this.emit('connected', this.deviceInfo)
          this.emit('statusUpdate', { 
            status: 'connected',
            message: `Connected to ESP32 on port ${port}` 
          })
          resolve(true)
        }

        this.ws.onclose = () => {
          clearTimeout(timeout)
          
          if (this.ws && !this.isDisconnecting) {
            const message = this.lastError || `Connection failed on port ${port}`
            console.log(`WebSocket closed: ${message}`)
            this.deviceInfo.status = 'DISCONNECTED'
            this.emit('disconnected')
            
            // Try next port if available
            this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length
            if (this.currentPortIndex !== 0) {
              this.emit('statusUpdate', { 
                status: 'connecting',
                message: `Connection failed on port ${port}, trying next port...\nMake sure you're connected to UnilorinAMS WiFi` 
              })
              this.connect() // Try next port
            } else {
              this.emit('statusUpdate', { 
                status: 'disconnected',
                message: 'Could not connect to ESP32.\nPlease check:\n1. ESP32 is powered on\n2. You are connected to UnilorinAMS WiFi\n3. Try power cycling the ESP32' 
              })
            }
          }
          
          this.ws = null
          resolve(false)
        }

        this.ws.onerror = (error) => {
          console.error(`WebSocket error on port ${port}:`, error)
          this.lastError = `Connection failed on port ${port}`
          this.deviceInfo.status = 'ERROR'
        }
      })

      return connected

    } catch (error) {
      console.error('Connection error:', error)
      this.lastError = 'Failed to initialize connection'
      this.emit('statusUpdate', { 
        status: 'error',
        message: 'Connection failed. Please check:\n1. ESP32 is powered on\n2. Connect to UnilorinAMS WiFi network' 
      })
      return false
    }
  }

  private sendMessage(message: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
      throw new Error('Device is not connected')
    }
  }

  private handleScanResult(result: ScanResult) {
    if (this.deviceInfo.status === 'BUSY') {
      this.deviceInfo.status = 'CONNECTED'
    }
    this.emit('scanComplete', result)
  }

  private handleError(error: string | Error) {
    this.deviceInfo.status = 'ERROR'
    const errorMessage = error instanceof Error ? error.message : error
    console.error('Hardware error:', errorMessage)
    
    // Instead of emitting an error event, emit a status update
    this.emit('statusUpdate', { 
      status: 'error',
      message: errorMessage 
    })
  }

  async scanFingerprint(userId: number): Promise<string> {
    console.log('Starting fingerprint scan for user:', userId)
    console.log('Current device status:', this.deviceInfo.status)
    console.log('WebSocket state:', this.ws?.readyState)

    if (!this.isConnected()) {
      console.error('Device not connected, attempting to connect...')
      await this.initializeConnection()
      if (!this.isConnected()) {
        throw new Error('Device is not connected')
      }
    }

    if (this.deviceInfo.status === 'BUSY') {
      throw new Error('Device is busy')
    }

    this.deviceInfo.status = 'BUSY'
    console.log('Device status set to BUSY')
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.deviceInfo.status = 'CONNECTED'
        console.error('Scan timeout reached')
        reject(new Error('Scan timeout'))
      }, this.scanTimeout)

      const handleResult = (result: ScanResult) => {
        console.log('Scan result received:', result)
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)

        if (result.success && result.fingerprintId !== undefined) {
          resolve(String(result.fingerprintId))
        } else {
          reject(new Error(result.error || 'Scan failed'))
        }
      }

      const handleError = (error: Error) => {
        console.error('Scan error:', error)
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)
        reject(error)
      }

      this.once('scanComplete', handleResult)
      this.once('error', handleError)

      try {
        console.log('Sending fingerprint scan command')
        this.sendMessage({
          command: 'fingerprint',
          action: 'scan'
        })
      } catch (error) {
        console.error('Error sending scan command:', error)
        handleError(error instanceof Error ? error : new Error('Failed to send scan command'))
      }
    })
  }

  async scanRFID(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Device is not connected')
    }

    if (this.deviceInfo.status === 'BUSY') {
      throw new Error('Device is busy')
    }

    this.deviceInfo.status = 'BUSY'
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.deviceInfo.status = 'CONNECTED'
        reject(new Error('Scan timeout'))
      }, this.scanTimeout)

      const handleResult = (result: ScanResult) => {
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)

        if (result.success && result.cardId) {
          resolve(result.cardId)
        } else {
          reject(new Error(result.error || 'Scan failed'))
        }
      }

      const handleError = (error: Error) => {
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)
        reject(error)
      }

      this.once('scanComplete', handleResult)
      this.once('error', handleError)

      this.sendMessage({
        command: 'rfid',
        action: 'scan'
      })
    })
  }

  async enrollFingerprint(userId: number): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Device is not connected')
    }

    if (this.deviceInfo.status === 'BUSY') {
      throw new Error('Device is busy')
    }

    this.deviceInfo.status = 'BUSY'
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.deviceInfo.status = 'CONNECTED'
        reject(new Error('Enrollment timeout'))
      }, this.scanTimeout)

      const handleResult = (result: ScanResult) => {
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)

        if (result.success) {
          resolve()
        } else {
          reject(new Error(result.error || 'Enrollment failed'))
        }
      }

      const handleError = (error: Error) => {
        clearTimeout(timeout)
        this.removeListener('scanComplete', handleResult)
        this.removeListener('error', handleError)
        reject(error)
      }

      this.once('scanComplete', handleResult)
      this.once('error', handleError)

      this.sendMessage({
        command: 'fingerprint',
        action: 'enroll',
        id: userId
      })
    })
  }

  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.deviceInfo.status === 'CONNECTED'
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        await this.initializeConnection()
      }
      return this.isConnected()
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

// Create the singleton instance
let hardwareServiceInstance: HardwareServiceImpl | null = null

// Export a function to get the singleton instance
export function getHardwareService(): HardwareServiceImpl {
  if (typeof window === 'undefined') {
    throw new Error('HardwareService can only be used on the client side')
  }
  
  if (!hardwareServiceInstance) {
    hardwareServiceInstance = new HardwareServiceImpl()
  }
  
  return hardwareServiceInstance
}

// Export a pre-initialized instance for direct imports
export const hardwareService = typeof window !== 'undefined' ? getHardwareService() : null 