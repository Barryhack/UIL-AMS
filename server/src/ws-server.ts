import { WebSocketServer, WebSocket } from 'ws'
import http, { IncomingMessage } from 'http'
import https from 'https'
import fs from 'fs'

// Render sets PORT automatically
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('PORT environment variable is not set!');
}
console.log(`[BOOT] Using PORT: ${PORT}`);
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
    console.log('New connection:', req.url, req.headers);
    // Identify client type
    const deviceId = req.headers['x-device-id'] as string
    const macAddress = req.headers['x-mac-address'] as string
    let isWebClient = !deviceId && !macAddress
    
    // If headers are not available, we'll identify by the first message
    ws.deviceId = deviceId
    ws.macAddress = macAddress
    ws.isAlive = true
    clients.add(ws)
    
    console.log(`New client connected - Headers: deviceId=${deviceId}, macAddress=${macAddress}, isWebClient=${isWebClient}`)
    
    // Don't send welcome message immediately - wait for first message to identify client type
    let welcomeSent = false
    
    ws.on('message', (data: string) => {
      console.log('Received message:', data.toString());
      try {
        const message = JSON.parse(data.toString())
        
        // Handle device identification from first message
        if (message.type === 'hello' && message.clientType === 'device') {
          ws.deviceId = message.deviceId || deviceId
          ws.macAddress = message.macAddress || macAddress
          isWebClient = false
          // Device-specific logging
          console.log(`📱 Device identified: ${ws.deviceId} (${ws.macAddress})`)
          // Send device-specific welcome
          ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Device connected to UNILORIN AMS WebSocket server',
            timestamp: new Date().toISOString()
          }))
          welcomeSent = true
          // Broadcast device online status to all web clients
          clients.forEach(client => {
            if (client !== ws && !client.deviceId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'device_status',
                deviceId: ws.deviceId,
                status: 'online'
              }))
            }
          })
          console.log(`[BROADCAST] Device status: deviceId=${ws.deviceId}, status=online`);
          return
        }
        
        // If this is the first message and it's not a device hello, treat as web client
        if (!welcomeSent) {
          isWebClient = true
          ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Web client connected to UNILORIN AMS WebSocket server',
            timestamp: new Date().toISOString()
          }))
          welcomeSent = true
        }
        
        // Broadcast device status updates to all web clients on status message
        if (message.type === 'status' && ws.deviceId) {
          clients.forEach(client => {
            if (!client.deviceId && client.readyState === WebSocket.OPEN) {
              console.log(`[SEND] device_status to web client: deviceId=${ws.deviceId}, status=${message.data.status}`);
              client.send(JSON.stringify({
                type: 'device_status',
                deviceId: ws.deviceId,
                status: message.data.status,
                ...message.data
              }))
            }
          })
          console.log(`[BROADCAST] Device status: deviceId=${ws.deviceId}, status=${message.data.status}`);
        }
        
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
    ws.on('close', (code, reason) => {
      console.log(`WebSocket disconnected: code=${code} reason=${reason && reason.toString('utf8')}`);
      // Broadcast device offline status if this was a device
      if (ws.deviceId) {
        clients.forEach(client => {
          if (client !== ws && !client.deviceId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'device_status',
              deviceId: ws.deviceId,
              status: 'offline'
            }))
          }
        })
        console.log(`[BROADCAST] Device status: deviceId=${ws.deviceId}, status=offline`);
      }
      clients.delete(ws);
    });
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
const httpServer = http.createServer(createHealthCheckHandler());
setupWSServer(httpServer, false);
httpServer.listen(PORT, () => {
  console.log(`WebSocket Server (WS) ready on ws://0.0.0.0:${PORT}/api/ws`);
});