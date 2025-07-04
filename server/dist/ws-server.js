"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
// Render sets PORT automatically
const PORT = process.env.PORT || 10000;
const CERT_PATH = process.env.SSL_CERT_PATH;
const KEY_PATH = process.env.SSL_KEY_PATH;
// Try to load SSL certs for WSS
let sslOptions = undefined;
if (CERT_PATH && KEY_PATH) {
    try {
        sslOptions = {
            cert: fs_1.default.readFileSync(CERT_PATH),
            key: fs_1.default.readFileSync(KEY_PATH),
        };
    }
    catch (err) {
        console.warn('SSL certs not found or invalid, falling back to WS.');
    }
}
const clients = new Set();
function setupWSServer(server, isSecure) {
    const wss = new ws_1.WebSocketServer({ server });
    wss.on('connection', (ws, req) => {
        // Identify client type
        const deviceId = req.headers['x-device-id'];
        const macAddress = req.headers['x-mac-address'];
        const isWebClient = !deviceId && !macAddress;
        if (!isWebClient && (!deviceId || !macAddress)) {
            ws.close();
            return;
        }
        ws.deviceId = deviceId;
        ws.macAddress = macAddress;
        ws.isAlive = true;
        clients.add(ws);
        console.log(isWebClient ? 'Web client connected (wss/ws)' : `Device connected: ${deviceId} (${macAddress})`);
        ws.send(JSON.stringify({
            type: 'welcome',
            message: isWebClient ? 'Connected to UNILORIN AMS WebSocket server (web)' : 'Connected to UNILORIN AMS WebSocket server',
            timestamp: new Date().toISOString()
        }));
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // Relay device_command to hardware
                if (message.type === 'device_command' && message.deviceId) {
                    const target = Array.from(clients).find(c => c.deviceId === message.deviceId && c.readyState === ws_1.WebSocket.OPEN);
                    if (target)
                        target.send(JSON.stringify(message));
                    else
                        ws.send(JSON.stringify({ type: 'error', message: 'Target device not found or not connected.' }));
                    return;
                }
                // Broadcast attendance updates to all web clients
                if (message.type === 'attendance') {
                    clients.forEach(client => {
                        if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'attendance_update', record: message.data }));
                        }
                    });
                }
            }
            catch (err) {
                console.error('Error processing message:', err);
            }
        });
        ws.on('close', () => clients.delete(ws));
        ws.on('pong', () => { ws.isAlive = true; });
    });
    // Heartbeat
    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false)
                return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
    return wss;
}
// Start server (WSS if certs, else WS)
if (sslOptions) {
    const httpsServer = https_1.default.createServer(sslOptions);
    setupWSServer(httpsServer, true);
    httpsServer.listen(PORT, () => {
        console.log(`Secure WebSocket Server (WSS) ready on wss://0.0.0.0:${PORT}/api/ws`);
    });
}
else {
    const httpServer = http_1.default.createServer();
    setupWSServer(httpServer, false);
    httpServer.listen(PORT, () => {
        console.log(`Insecure WebSocket Server (WS) ready on ws://0.0.0.0:${PORT}/api/ws`);
    });
}
// For Render: expose only one port per service. Deploy separate services for WSS and WS if needed. 
