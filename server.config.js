module.exports = {
    server: {
        host: '0.0.0.0',  // Listen on all network interfaces
        port: 3000,
    },
    websocket: {
        path: '/api/ws',  // Match the path used by the ESP32
        protocols: ['arduino'],
        headers: {
            'Access-Control-Allow-Origin': '*',  // Allow connections from any origin
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'X-API-Key, X-Device-ID, X-MAC-Address',
        }
    }
}; 