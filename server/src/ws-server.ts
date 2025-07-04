import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'

// Load environment variables
const PORT_WS = process.env.WS_PORT || 4011 // Insecure (hardware)
const PORT_WSS = process.env.WSS_PORT || 4010 // Secure (web clients)
const CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '../../certs/cert.pem')
const KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '../../certs/key.pem')

// Load SSL certs for WSS
let sslOptions = undefined
try {
  sslOptions = {
    cert: fs.readFileSync(CERT_PATH),
    key: fs.readFileSync(KEY_PATH),
  }
} catch (err) {
  console.warn('SSL certs not found or invalid, WSS will not start.')
}

interface ExtendedWebSocket extends WebSocket {
  deviceId?: string
  macAddress?: string
  isAlive?: boolean
}

const clients = new Set<ExtendedWebSocket>()

function setupWSServer(server: http.Server | https.Server, isSecure: boolean) {
  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // Identify client type
    const deviceId = req.headers['x-device-id'] as string
    const macAddress = req.headers['x-mac-address'] as string
    const isWebClient = !deviceId && !macAddress
    if (!isWebClient && (!deviceId || !macAddress)) {
      ws.close()
      return
    }
    ws.deviceId = deviceId
    ws.macAddress = macAddress
    ws.isAlive = true
    clients.add(ws)
    console.log(isWebClient ? 'Web client connected (wss)' : `Device connected: ${deviceId} (${macAddress})`)
    ws.send(JSON.stringify({
      type: 'welcome',
      message: isWebClient ? 'Connected to UNILORIN AMS WebSocket server (web)' : 'Connected to UNILORIN AMS WebSocket server',
      timestamp: new Date().toISOString()
    }))
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString())
        // Relay device_command to hardware
        if (message.type === 'device_command' && message.deviceId) {
          const target = Array.from(clients).find(c => c.deviceId === message.deviceId && c.readyState === WebSocket.OPEN)
          if (target) target.send(JSON.stringify(message))
          else ws.send(JSON.stringify({ type: 'error', message: 'Target device not found or not connected.' }))
          return
        }
        // Broadcast attendance updates to all web clients
        if (message.type === 'attendance') {
          clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'attendance_update', record: message.data }))
            }
          })
        }
      } catch (err) {
        console.error('Error processing message:', err)
      }
    })
    ws.on('close', () => clients.delete(ws))
    ws.on('pong', () => { ws.isAlive = true })
  })
  // Heartbeat
  setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)
  return wss
}

// Start insecure WS server (hardware)
const httpServer = http.createServer()
setupWSServer(httpServer, false)
httpServer.listen(PORT_WS, () => {
  console.log(`Insecure WebSocket Server (WS) ready on ws://0.0.0.0:${PORT_WS}/api/ws`)
})

// Start secure WSS server (web clients)
if (sslOptions) {
  const httpsServer = https.createServer(sslOptions)
  setupWSServer(httpsServer, true)
  httpsServer.listen(PORT_WSS, () => {
    console.log(`Secure WebSocket Server (WSS) ready on wss://0.0.0.0:${PORT_WSS}/api/ws`)
  })
} else {
  console.warn('WSS server not started: SSL certs missing.')
} 