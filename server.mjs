import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 3000;
const hostname = 'localhost';

// --- SSL Options ---
// In a real production environment, you would use professionally signed certs.
// For local dev, we use the self-signed ones we just generated.
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

app.prepare().then(() => {
  // --- HTTPS Server for the Next.js App (Port 3000) ---
  createHttpsServer(sslOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on https://0.0.0.0:${port}`);
  });

  const deviceClients = new Map();
  const webClients = new Set();

  // --- WSS (Secure) WebSocket Server for Web App (Port 4010) ---
  const wsServerSecure = createHttpsServer(sslOptions);
  const wss = new WebSocketServer({ server: wsServerSecure, path: '/api/ws' });

  wss.on('connection', (ws, req) => {
    console.log('Web client connected (wss)');
    webClients.add(ws);

    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to UNILORIN AMS WebSocket server (web)' }));

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Message from web client:', parsedMessage);

        // Try to get deviceId from data object first, then from message root
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
            // Optionally, handle broadcasting or erroring
        }
      } catch (e) {
        console.error('Failed to parse or forward message from web client:', e);
      }
    });

    ws.on('close', () => {
      webClients.delete(ws);
      console.log('Web client disconnected (wss)');
    });
  });

  wsServerSecure.listen(4010, '0.0.0.0', () => {
    console.log(`> Secure WebSocket Server (WSS) ready on wss://0.0.0.0:4010/api/ws`);
  });

  // --- WS (Insecure) WebSocket Server for Hardware (Port 4011) ---
  const wsServerInsecure = createHttpServer();
  const wsHardware = new WebSocketServer({ server: wsServerInsecure, path: '/api/ws' });

  wsHardware.on('connection', (ws, req) => {
    console.log('Hardware connection attempt, URL:', req.url);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const deviceId = url.searchParams.get('deviceId');
    console.log('Extracted deviceId:', deviceId);
    
    if (!deviceId) {
        console.log('Hardware connection rejected: missing deviceId');
        ws.terminate();
        return;
    }
    
    deviceClients.set(deviceId, ws);
    console.log(`Hardware device connected: ${deviceId} (ws)`);

    ws.send(JSON.stringify({ type: 'welcome', message: `Connected to UNILORIN AMS WebSocket server (device: ${deviceId})` }));
    
    // Forward messages from hardware to all web clients
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
  });

  wsServerInsecure.listen(4011, '0.0.0.0', () => {
    console.log(`> Insecure WebSocket Server (WS) ready on ws://0.0.0.0:4011/api/ws`);
  });
}); 