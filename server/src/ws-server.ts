import { WebSocketServer, WebSocket } from 'ws'
import http, { IncomingMessage } from 'http'
import https from 'https'
import fs from 'fs'

// Render sets PORT automatically
const PORT = process.env.PORT || 10000
const CERT_PATH = process.env.SSL_CERT_PATH
const KEY_PATH = process.env.SSL_KEY_PATH

// Try to load SSL certs for WSS
let sslOptions: { cert: Buffer; key: Buffer } | undefined = undefined
if (CERT_PATH && KEY_PATH) {
  try {
    sslOptions = {
      cert: fs.readFileSync(CERT_PATH),
      key: fs.readFileSync(KEY_PATH),
    }
  } catch (err) {
    console.warn('SSL certs not found or invalid, falling back to WS.')
  }
}

type ExtendedWebSocket = WebSocket & {
  deviceId?: string
  macAddress?: string
  isAlive?: boolean
}

const clients = new Set<ExtendedWebSocket>()

function setupWSServer(server: http.Server | https.Server, isSecure: boolean) {
  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
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
    console.log(isWebClient ? 'Web client connected (wss/ws)' : `Device connected: ${deviceId} (${macAddress})`)
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

// --- Add this HTTP handler for health checks ---
function createHealthCheckHandler() {
  return (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    }
  };
}

// Start server (WSS if certs, else WS)
if (sslOptions) {
  const httpsServer = https.createServer(sslOptions, createHealthCheckHandler())
  setupWSServer(httpsServer, true)
  httpsServer.listen(PORT, () => {
    console.log(`Secure WebSocket Server (WSS) ready on wss://0.0.0.0:${PORT}/api/ws`)
  })
} else {
  const httpServer = http.createServer(createHealthCheckHandler())
  setupWSServer(httpServer, false)
  httpServer.listen(PORT, () => {
    console.log(`