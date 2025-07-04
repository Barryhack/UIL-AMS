const WebSocket = require('ws');

console.log('Testing WebSocket connection to wss://192.168.60.118:4010/api/ws');

const ws = new WebSocket('wss://192.168.60.118:4010/api/ws');

ws.on('open', () => {
  console.log('WebSocket connection opened successfully!');
  
  // Send a test message
  ws.send(JSON.stringify({
    command: 'fingerprint',
    action: 'enroll',
    id: 'test-user-123'
  }));
});

ws.on('message', (data) => {
  console.log('Received message:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed with code: ${code}, reason: ${reason}`);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('Closing test connection...');
  ws.close();
  process.exit(0);
}, 10000); 