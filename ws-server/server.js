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
const wss = new WebSocket.Server({ server });

console.log('🚀 Starting WebSocket server...');

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

  // Determine client type - accept hardware devices with just deviceId
  if (deviceId) {
    // Hardware device (with or without MAC address)
    connectedDevices.set(deviceId, {
      ws,
      macAddress: macAddress || 'unknown',
      lastSeen: Date.now(),
      type: 'hardware'
    });
    console.log(`✅ Hardware device ${deviceId} connected`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      message: 'Hardware device connected successfully'
    }));
  } else {
    // Web client
    webClients.add(ws);
    console.log(`🌐 Web client connected (total: ${webClients.size})`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      message: 'Web client connected successfully'
    }));
  }

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received message:`, data);
      
      // Handle different message types
      if (data.type === 'attendance_record') {
        // Broadcast attendance record to all web clients
        broadcastToWebClients({
          type: 'attendance_update',
          data: data.data
        });
      } else if (data.type === 'fingerprint_result') {
        // Handle fingerprint results
        console.log(`👆 Fingerprint result:`, data);
      } else if (data.type === 'rfid_result') {
        // Handle RFID results
        console.log(`💳 RFID result:`, data);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
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
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`WebSocket Server (WS) ready on ws://0.0.0.0:${PORT}/api/ws`);
});

// Export functions for external use
module.exports = {
  broadcastToWebClients,
  sendToDevice,
  broadcastToDevices,
  connectedDevices,
  webClients
}; 