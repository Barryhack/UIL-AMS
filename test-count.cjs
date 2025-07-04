const WebSocket = require('ws');

console.log('Testing fingerprint count...');

const ws = new WebSocket('wss://192.168.60.118:4010/api/ws', {
  rejectUnauthorized: false
});

ws.on('open', () => {
  console.log('✅ Connected to secure WebSocket server!');
  
  const countCommand = {
    command: 'fingerprint',
    action: 'count'
  };
  
  console.log('Sending count command:', countCommand);
  ws.send(JSON.stringify(countCommand));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  if (message.type === 'template_count') {
    console.log(`📊 Fingerprint templates: ${message.count}`);
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

setTimeout(() => {
  console.log('⏰ Timeout reached');
  ws.close();
  process.exit(1);
}, 10000); 