const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const urls = [
    'ws://127.0.0.1:4010/api/ws',
    'ws://localhost:4010/api/ws',
    'ws://192.168.60.118:4010/api/ws'
];

async function testConnection(url) {
    return new Promise((resolve) => {
        console.log(`Testing: ${url}`);
        
        const ws = new WebSocket(url);
        
        ws.on('open', () => {
            console.log(`✅ SUCCESS: Connected to ${url}`);
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            console.log(`❌ ERROR: Failed to connect to ${url} - ${error.message}`);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log(`Connection closed for ${url}`);
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                console.log(`⏰ TIMEOUT: Connection to ${url} timed out`);
                ws.close();
                resolve(false);
            }
        }, 3000);
    });
}

async function runTests() {
    for (const url of urls) {
        const success = await testConnection(url);
        if (success) {
            console.log(`\n🎉 Working URL found: ${url}`);
            break;
        }
        console.log('');
    }
}

runTests(); 