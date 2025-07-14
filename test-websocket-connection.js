import WebSocket from 'ws';
import https from 'https';

console.log('Testing WebSocket connection to unilorin-ams-ws-server.onrender.com...');

// Test the Render server
const ws = new WebSocket('wss://unilorin-ams-ws-server.onrender.com/api/ws', {
  headers: {
    'x-device-id': 'UNILORIN_AMS_1',
    'x-mac-address': 'ESP32_DEVICE'
  }
});

ws.on('open', () => {
  console.log('✅ WebSocket connection opened successfully!');
  
  // Send hello message like the ESP32 would
  const helloMessage = {
    type: 'hello',
    clientType: 'device',
    deviceId: 'UNILORIN_AMS_1',
    macAddress: 'ESP32_DEVICE',
    message: 'ESP32 device connected'
  };
  
  ws.send(JSON.stringify(helloMessage));
  console.log('📤 Sent hello message:', helloMessage);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received message:', message);
    
    if (message.type === 'welcome') {
      console.log('✅ Server welcome message received - connection is working!');
    }
  } catch (error) {
    console.log('📥 Received raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.log('⏰ Connection timeout after 10 seconds');
    ws.terminate();
  }
}, 10000);

// Also test HTTP endpoint
const httpOptions = {
  hostname: 'unilorin-ams-ws-server.onrender.com',
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 5000
};

console.log('\nTesting HTTP endpoint...');

const httpReq = https.request(httpOptions, (res) => {
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`📄 HTTP Response: ${chunk.toString()}`);
  });
});

httpReq.on('error', (error) => {
  console.error('❌ HTTP Error:', error.message);
});

httpReq.on('timeout', () => {
  console.log('⏰ HTTP request timeout');
  httpReq.destroy();
});

httpReq.end(); 