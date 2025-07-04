import { Server as HTTPServer } from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import prisma from '@/lib/prisma'
import config from '../server.config'
import { NextApiResponse } from 'next'
import { Socket } from 'net'

interface DeviceMessage {
  type: 'ATTENDANCE' | 'SYNC' | 'STATUS' | 'ERROR'
  deviceId: string
  data: any
  timestamp: number
  isOfflineRecord?: boolean
}

interface ExtendedWebSocket extends WebSocket {
  deviceId?: string
  macAddress?: string
  isAlive?: boolean
}

class WebSocketHandler {
  private static instance: WebSocketHandler
  private wss: WebSocketServer | null = null
  private clients: Set<ExtendedWebSocket> = new Set()
  private pingInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebSocketHandler {
    if (!WebSocketHandler.instance) {
      WebSocketHandler.instance = new WebSocketHandler()
    }
    return WebSocketHandler.instance
  }

  public initialize(server: any) {
    if (this.wss) {
      console.log('WebSocket server already initialized')
      return
    }

    this.wss = new WebSocketServer({ server })
    console.log('WebSocket server initialized')

    this.wss.on('connection', (ws: ExtendedWebSocket, request) => {
      console.log('New WebSocket connection')
      
      // Get device information from headers
      const deviceId = request.headers['x-device-id'] as string
      const macAddress = request.headers['x-mac-address'] as string
      
      // Allow web clients (no headers) to connect, but require both headers for hardware
      const isWebClient = !deviceId && !macAddress
      if (!isWebClient && (!deviceId || !macAddress)) {
        console.log('Missing device information, closing connection')
        ws.close()
        return
      }

      // Set device information and mark as alive (for hardware clients)
      ws.deviceId = deviceId
      ws.macAddress = macAddress
      ws.isAlive = true

      // Add to clients set
      this.clients.add(ws)
      if (isWebClient) {
        console.log('Web client connected (wss)')
      } else {
        console.log(`Device connected: ${deviceId} (${macAddress})`)
      }

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: isWebClient
          ? 'Connected to UNILORIN AMS WebSocket server (web)'
          : 'Connected to UNILORIN AMS WebSocket server',
        timestamp: new Date().toISOString()
      }))

      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString())
          console.log('Received:', message)

          // Handle web client device commands
          if (message.type === 'device_command' && message.deviceId) {
            // Find the target device WebSocket
            const target = Array.from(this.clients).find(
              client => client.deviceId === message.deviceId && client.readyState === WebSocket.OPEN
            );
            if (target) {
              // Forward the command to the device
              target.send(JSON.stringify(message));
              ws.send(JSON.stringify({ type: 'ack', message: 'Command forwarded to device.' }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Target device not found or not connected.' }));
            }
            return; // Don't process further
          }

          // Handle different message types
          switch (message.type) {
            case 'rfid_scan':
              this.handleRFIDScan(ws, message)
              break
            case 'attendance':
              this.handleAttendance(ws, message)
              break
            case 'hello':
              // Just log the hello message
              console.log(`Hello from device: ${ws.deviceId}`)
              break
            default:
              console.log(`Unknown message type: ${message.type}`)
          }
        } catch (error) {
          console.error('Error processing message:', error)
        }
      })

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`Device disconnected: ${ws.deviceId}`)
        this.clients.delete(ws)
      })

      // Handle pong messages
      ws.on('pong', () => {
        ws.isAlive = true
      })
    })

    // Start ping interval
    this.pingInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: ExtendedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`Terminating inactive connection: ${ws.deviceId}`)
          return ws.terminate()
        }

        ws.isAlive = false
        ws.ping()
      })
    }, 30000)

    // Handle server shutdown
    this.wss.on('close', () => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
      }
    })
  }

  private async handleRFIDScan(ws: ExtendedWebSocket, message: any) {
    console.log(`RFID scan from device ${ws.deviceId}: ${message.uid}`)
    
    // Send acknowledgment back to device
    ws.send(JSON.stringify({
      type: 'scan_received',
      uid: message.uid,
      timestamp: new Date().toISOString()
    }))

    // TODO: Implement your RFID scan handling logic here
    // For example, update attendance records in the database
  }

  private async handleAttendance(ws: ExtendedWebSocket, message: any) {
    try {
      const { deviceId, data } = message;
      if (!deviceId || !data) {
        ws.send(JSON.stringify({
          type: 'attendance_ack',
          success: false,
          error: 'Missing deviceId or data in attendance message',
        }))
        return;
      }
      // Store attendance record in the database
      const record = await prisma.attendanceRecord.create({
        data: {
          ...data,
          deviceId,
        }
      })
      ws.send(JSON.stringify({
        type: 'attendance_ack',
        success: true,
        record,
      }))
      console.log(`Attendance recorded from device ${deviceId}:`, record)
      // Broadcast to all clients (web clients included)
      this.broadcast({
        type: 'attendance_update',
        record,
      })
    } catch (error: any) {
      console.error('Error handling attendance message:', error)
      ws.send(JSON.stringify({
        type: 'attendance_ack',
        success: false,
        error: error.message || 'Failed to record attendance',
      }))
    }
  }

  public broadcast(message: any) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  public broadcastToDevices(message: any) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  public getConnectedDevices() {
    return Array.from(this.clients).map(client => ({
      deviceId: client.deviceId,
      macAddress: client.macAddress,
      connected: client.readyState === WebSocket.OPEN
    }))
  }
}

export default WebSocketHandler 

// Export the broadcastToDevices function for use in API routes
export const broadcastToDevices = (message: any) => {
  const handler = WebSocketHandler.getInstance()
  handler.broadcastToDevices(message)
} 