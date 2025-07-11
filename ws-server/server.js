const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const url = require('url');

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'WebSocket server is running!',
      timestamp: new Date().toISOString(),
      status: 'ok',
      connections: wss.clients.size
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/api/ws' });

console.log('🚀 Starting WebSocket server...');
console.log('PORT ENV:', process.env.PORT);

// Track connected devices
const connectedDevices = new Map();
const webClients = new Set();

wss.on('connection', (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const deviceId = parsedUrl.query.deviceId;
  const macAddress = req.headers['x-mac-address'];
  
  console.log(`🔌 New connection from: ${req.socket.remoteAddress}`);
  console.log(`📱 Device ID: ${deviceId || 'web-client'}`);
  console.log(`🔗 MAC Address: ${macAddress || 'N/A'}`);

  let isHardware = false;
  let thisDeviceId = deviceId;
  let welcomeSent = false;
  let messageReceived = false;

  ws.on('message', (message) => {
    messageReceived = true;
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received message:`, data);
      if (!welcomeSent) {
        if (data.type === 'hello' && data.clientType === 'device' && data.deviceId) {
          isHardware = true;
          thisDeviceId = data.deviceId;
          connectedDevices.set(thisDeviceId, {
            ws,
            macAddress: data.macAddress || 'unknown',
            lastSeen: Date.now(),
            type: 'hardware'
          });
          webClients.delete(ws);
          console.log(`✅ Hardware device ${thisDeviceId} identified by hello message`);
          ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            message: 'Hardware device connected successfully (by hello)'
          }));
        } else {
          webClients.add(ws);
          console.log(`🌐 Web client connected (total: ${webClients.size})`);
          ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            message: 'Web client connected successfully'
          }));
        }
        welcomeSent = true;
        return;
      }
      // Handle different message types
      if (data.type === 'attendance_record') {
        broadcastToWebClients({
          type: 'attendance_update',
          data: data.data
        });
        // Also broadcast as scan event for registration feedback
        broadcastToWebClients({
          type: 'scan',
          scanType: data.data.type === 'fingerprint' ? 'fingerprint' : (data.data.type === 'rfid' ? 'rfid' : 'unknown'),
          data: data.data.identifier,
          userId: data.data.userId || null
        });
      } else if (data.type === 'fingerprint_result') {
        console.log(`👆 Fingerprint result:`, data);
        // Broadcast scan event for fingerprint
        broadcastToWebClients({
          type: 'scan',
          scanType: 'fingerprint',
          data: data.fingerprintId || data.data || '',
          userId: data.userId || null
        });
      } else if (data.type === 'rfid_result') {
        console.log(`💳 RFID result:`, data);
        // Broadcast scan event for RFID
        broadcastToWebClients({
          type: 'scan',
          scanType: 'rfid',
          data: data.rfidUid || data.data || '',
          userId: data.userId || null
        });
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    if (messageReceived) {
      console.log('Connection closed after receiving at least one message.');
    } else {
      console.log('Connection closed before any message was received.');
    }
    if (deviceId) {
      connectedDevices.delete(deviceId);
      console.log(`❌ Hardware device ${deviceId} disconnected`);
    } else {
      webClients.delete(ws);
      console.log(`❌ Web client disconnected (total: ${webClients.size})`);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  ws.on('pong', () => {
    console.log('Received pong from client');
  });
});

// Function to broadcast to all web clients
function broadcastToWebClients(message) {
  const messageStr = JSON.stringify(message);
  webClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Function to send command to specific hardware device
function sendToDevice(deviceId, command) {
  const device = connectedDevices.get(deviceId);
  if (device && device.ws.readyState === WebSocket.OPEN) {
    device.ws.send(JSON.stringify(command));
    return true;
  }
  return false;
}

// Function to broadcast to all hardware devices
function broadcastToDevices(command) {
  const messageStr = JSON.stringify(command);
  let sentCount = 0;
  
  connectedDevices.forEach((device, deviceId) => {
    if (device.ws.readyState === WebSocket.OPEN) {
      device.ws.send(messageStr);
      sentCount++;
    }
  });
  
  return sentCount;
}

// Start server
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('PORT environment variable is not set!');
}
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`WebSocket Server (WS) ready on ws://0.0.0.0:${PORT}/api/ws`);
});

// Send ping to all clients every 25 seconds to keep connections alive
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 25000);

// Export functions for external use
module.exports = {
  broadcastToWebClients,
  sendToDevice,
  broadcastToDevices,
  connectedDevices,
  webClients
}; 