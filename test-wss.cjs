const WebSocket = require('ws');

console.log('Testing WSS connection...');

const ws = new WebSocket('wss://192.168.60.118:4010/api/ws', {
  rejectUnauthorized: false // Accept self-signed certs for testing
});

ws.on('open', () => {
  console.log('✅ SUCCESS: Connected to WSS server!');
  ws.close();
});

ws.on('error', (err) => {
  console.error('❌ WSS connection error:', err.message);
});

ws.on('close', () => {
  console.log('Connection closed');
}); 