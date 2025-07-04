const { WebSocketServer } = require('ws');
const { createServer } = require('http');

console.log('Starting simple WebSocket server...');

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/api/ws',
  perMessageDeflate: false,
  maxPayload: 65536,
  skipUTF8Validation: true
});

const deviceClients = new Map();
const webClients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  console.log('New client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to UNILORIN AMS WebSocket server (secure)',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      if (
        message.command === 'create_attendance_session' ||
        message.command === 'register_user' ||
        message.command === 'fingerprint' ||
        message.command === 'rfid'
      ) {
        // Relay command to a target device or all devices
        const targetDeviceId = message.deviceId;
        if (targetDeviceId && deviceClients.has(targetDeviceId)) {
          deviceClients.get(targetDeviceId).send(JSON.stringify(message));
        } else if (deviceClients.size > 0) {
          // Default to first device if no ID specified
          const firstDevice = Array.from(deviceClients.values())[0];
          firstDevice.send(JSON.stringify(message));
          console.log(`Command ${message.command} relayed to the first device.`);
        } else {
          console.log('No devices connected to relay command to.');
          ws.send(JSON.stringify({ type: 'error', message: 'No hardware device connected.' }));
        }

        // Acknowledge relay
        ws.send(JSON.stringify({
          type: 'relay_ack',
          command: message.command,
          relayed: true,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    webClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server on port 4010
const PORT = 4010;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`> Simple WebSocket Server ready on ws://0.0.0.0:${PORT}/api/ws`);
  console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 