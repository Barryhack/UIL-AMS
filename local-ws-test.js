const { WebSocketServer } = require('ws');
const { createServer } = require('http');

console.log('Starting local WebSocket test server...');

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/api/ws',
  perMessageDeflate: false
});

console.log('Local WebSocket server created');

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  console.log('✅ ESP32 connected to local server!');
  console.log('Headers:', request.headers);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to local test WebSocket server',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Received from ESP32:', message);
      
      // Echo back the message
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 ESP32 disconnected from local server');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start server on port 8080
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`> Local WebSocket Server ready on ws://0.0.0.0:${PORT}/api/ws`);
  console.log(`> Test URL: ws://192.168.249.1:${PORT}/api/ws (replace with your PC's IP)`);
  console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping local WebSocket server...');
  server.close();
  process.exit(0);
}); 