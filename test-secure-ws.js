const WebSocket = require('ws');

console.log('Testing secure WebSocket connection...');

// Create WebSocket with SSL verification disabled for self-signed certs
const ws = new WebSocket('wss://192.168.60.118:4010/api/ws', {
  rejectUnauthorized: false // Allow self-signed certificates
});

ws.on('open', () => {
  console.log('✅ Connected to secure WebSocket server!');
  
  // Send delete all fingerprints command
  const deleteCommand = {
    command: 'fingerprint',
    action: 'delete_all'
  };
  
  console.log('Sending delete command:', deleteCommand);
  ws.send(JSON.stringify(deleteCommand));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  if (message.type === 'delete_result') {
    if (message.success) {
      console.log('✅ All fingerprint templates deleted successfully!');
    } else {
      console.log('❌ Failed to delete:', message.error);
    }
    ws.close();
  } else if (message.type === 'relay_ack') {
    console.log('📤 Command relayed to hardware device');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed (code: ${code}, reason: ${reason})`);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Timeout reached');
  ws.close();
  process.exit(1);
}, 10000); 