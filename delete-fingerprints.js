const WebSocket = require('ws');

console.log('Connecting to WebSocket server to delete all fingerprints...');

const ws = new WebSocket('wss://192.168.60.118:4010/api/ws');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
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
  console.log('Received message:', message);
  
  if (message.type === 'delete_result') {
    if (message.success) {
      console.log('✅ All fingerprint templates deleted successfully!');
    } else {
      console.log('❌ Failed to delete fingerprint templates:', message.error);
    }
    ws.close();
  } else if (message.type === 'welcome') {
    console.log('Server welcome message received');
  } else if (message.type === 'relay_ack') {
    console.log('Command relayed to hardware device');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Timeout reached, closing connection');
  ws.close();
  process.exit(1);
}, 10000); 