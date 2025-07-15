import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;
const hostname = 'localhost';

app.prepare().then(() => {
  // --- HTTP Server for the Next.js App and WebSocket (Single Port) ---
  const httpServer = createHttpServer((req, res) => {
      const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const deviceClients = new Map();
  const webClients = new Set();

  // --- WebSocket Server for Web App and Hardware (Same Port) ---
  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

  wss.on('connection', (ws, req) => {
    // Determine if this is a hardware or web client by URL param
    const url = new URL(req.url, `http://${req.headers.host}`);
    const deviceId = url.searchParams.get('deviceId');
    if (deviceId) {
      // Hardware client
      deviceClients.set(deviceId, ws);
      console.log(`Hardware device connected: ${deviceId} (ws)`);
      ws.send(JSON.stringify({ type: 'welcome', message: `Connected to UNILORIN AMS WebSocket server (device: ${deviceId})` }));
      ws.on('message', (message) => {
        console.log(`Message from hardware ${deviceId}: ${message}`);
        for (const client of webClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        }
      });
      ws.on('close', () => {
        deviceClients.delete(deviceId);
        console.log(`Hardware device disconnected: ${deviceId} (ws)`);
      });
      } else {
      // Web client
        webClients.add(ws);
      console.log('Web client connected (ws)');
      ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to UNILORIN AMS WebSocket server (web)' }));
      ws.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log('Message from web client:', parsedMessage);
          const targetDeviceId = parsedMessage.data?.deviceId || parsedMessage.deviceId || 'UNILORIN_AMS_1';
          if (deviceClients.has(targetDeviceId)) {
            const hardwareSocket = deviceClients.get(targetDeviceId);
            if (hardwareSocket && hardwareSocket.readyState === WebSocket.OPEN) {
              console.log(`Forwarding command to device ${targetDeviceId}`);
              hardwareSocket.send(JSON.stringify(parsedMessage));
            } else {
              console.log(`Device ${targetDeviceId} not connected or not ready.`);
              ws.send(JSON.stringify({ type: 'error', message: `Device ${targetDeviceId} is not connected.` }));
            }
              } else {
            console.log(`Command received without target deviceId or device not found.`);
          }
        } catch (e) {
          console.error('Failed to parse or forward message from web client:', e);
        }
      });
      ws.on('close', () => {
          webClients.delete(ws);
        console.log('Web client disconnected (ws)');
      });
    }
  });

  httpServer.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`> WebSocket Server (WS) ready on ws://0.0.0.0:${port}/api/ws`);
  });
}); 