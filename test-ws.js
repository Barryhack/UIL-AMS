import WebSocket from 'ws';

console.log('🔌 Testing WebSocket connection...');
console.log('URL: wss://unilorin-ams-ws-server.onrender.com/?deviceId=UNILORIN_AMS_1');
console.log('');

// Create WebSocket connection
const ws = new WebSocket('wss://unilorin-ams-ws-server.onrender.com/?deviceId=UNILORIN_AMS_1');

// Connection opened
ws.on('open', function open() {
    console.log('✅ WebSocket connection established!');
    console.log('📤 Sending test message...');
    
    // Send a test message
    const testMessage = {
        type: 'test',
        message: 'Hello from Node.js test!',
        timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(testMessage));
});

// Listen for messages
ws.on('message', function message(data) {
    console.log('📨 Received message:', data.toString());
});

// Connection closed
ws.on('close', function close(code, reason) {
    console.log('🔴 WebSocket connection closed');
    console.log('Code:', code);
    console.log('Reason:', reason.toString());
    
    if (code === 1006) {
        console.log('⚠️  Connection closed abnormally (code 1006)');
        console.log('   This usually means the server rejected the connection');
        console.log('   or the hosting platform doesn\'t support WebSockets');
    }
});

// Connection error
ws.on('error', function error(err) {
    console.log('🚨 WebSocket error:', err.message);
});

// Set a timeout to close the connection after 10 seconds
setTimeout(() => {
    console.log('⏰ Test timeout reached, closing connection...');
    ws.close();
    process.exit(0);
}, 10000); 