const { WebSocketServer } = require('ws');
const { createServer } = require('http');

// Create a standalone WebSocket server
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.send(JSON.stringify({
        type: 'connection',
        payload: { status: 'connected' }
    }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('Received message:', message);

            ws.send(JSON.stringify({
                type: 'echo',
                payload: message
            }));
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Invalid message format' }
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Start the server on port 3001
server.listen(3001, () => {
    console.log('WebSocket server running on ws://localhost:3001');
}); 