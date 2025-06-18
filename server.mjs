import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';  // Listen on all network interfaces
const port = process.env.PORT || 3000;

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize WebSocket server with specific options for ESP32
  const wss = new WebSocketServer({ 
    server,
    path: '/api/ws',
    perMessageDeflate: false,  // Disable compression for ESP32
    maxPayload: 65536,        // Reasonable max payload size
    skipUTF8Validation: true  // Be more permissive with message encoding
  });
  
  wss.on('connection', (ws, request) => {
    console.log('Headers:', request.headers); // Log all headers for debugging
    console.log('New WebSocket connection');
    
    // Get device information from headers
    const deviceId = request.headers['x-device-id'];
    const macAddress = request.headers['x-mac-address'];
    const apiKey = request.headers['x-api-key'];
    
    // Validate headers - use environment variable for API key in production
    const expectedApiKey = process.env.HARDWARE_API_KEY || 'local-development-key';
    if (!deviceId || !macAddress || apiKey !== expectedApiKey) {
      console.log('Invalid headers, closing connection');
      ws.close();
      return;
    }

    console.log(`Device connected: ${deviceId} (${macAddress})`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to UNILORIN AMS WebSocket server',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received:', message);

        // Handle different message types
        switch (message.type) {
          case 'hello':
            console.log(`Hello from device: ${deviceId}`);
            break;
          case 'device_info':
            console.log(`Device info from ${deviceId}: ${JSON.stringify(message)}`);
            ws.send(JSON.stringify({
              type: 'device_info_ack',
              message: 'Device info received',
              timestamp: new Date().toISOString()
            }));
            break;
          case 'rfid_scan':
            console.log(`RFID scan from device ${deviceId}: ${message.uid}`);
            ws.send(JSON.stringify({
              type: 'scan_received',
              uid: message.uid,
              timestamp: new Date().toISOString()
            }));
            break;
          default:
            console.log(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`Device disconnected: ${deviceId}`);
    });

    // Setup ping-pong with longer interval for ESP32
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Ping all clients every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(interval);
  });

  // Listen on all network interfaces
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server is running on ws://${hostname}:${port}/api/ws`);
  });
}); 