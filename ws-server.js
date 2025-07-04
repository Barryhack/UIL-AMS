const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a standalone WebSocket server
const server = createServer(async (req, res) => {
    if (req.url.startsWith('/delete-all-fingerprints')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const deviceId = url.searchParams.get('deviceId');
        if (!deviceId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing deviceId' }));
            return;
        }
        const ws = connectedDevices.get(deviceId);
        if (ws) {
            ws.send(JSON.stringify({ command: 'fingerprint', action: 'delete_all' }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Delete all fingerprints command sent' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Device not connected' }));
        }
        return;
    }
});

const wss = new WebSocketServer({ server });

// Store connected devices
const connectedDevices = new Map();

wss.on('connection', (ws, req) => {
    console.log('Client connected');
    
    // Extract device ID from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const deviceId = url.searchParams.get('deviceId');
    
    if (deviceId) {
        connectedDevices.set(deviceId, ws);
        console.log(`Device ${deviceId} connected`);
        
        // Update device status in database
        updateDeviceStatus(deviceId, 'ONLINE', 'Device connected');
    }

    ws.send(JSON.stringify({
        type: 'connection',
        payload: { status: 'connected' }
    }));

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('Received message:', message);

            // Handle device_command from API and forward to device
            if (message.type === 'device_command') {
                console.log('[WS SERVER] Received device_command from API:', message);
                const targetDeviceId = message.deviceId;
                const deviceSocket = connectedDevices.get(targetDeviceId);
                if (deviceSocket) {
                    const msgToDevice = JSON.stringify({
                        command: message.command,
                        ...message.parameters
                    });
                    console.log(`[WS SERVER] Forwarding to device ${targetDeviceId}:`, msgToDevice);
                    deviceSocket.send(msgToDevice);
                    console.log(`Forwarded command '${message.command}' to device ${targetDeviceId}`);
                } else {
                    console.log(`Device ${targetDeviceId} not connected`);
                }
                return;
            }

            // Handle different message types
            switch (message.type) {
                case 'command_result':
                    await handleCommandResult(deviceId, message);
                    break;
                case 'command_acknowledgment':
                    await handleCommandAcknowledgment(deviceId, message);
                    break;
                case 'fingerprint_result':
                    await handleFingerprintResult(deviceId, message);
                    break;
                case 'rfid_result':
                    await handleRfidResult(deviceId, message);
                    break;
                case 'attendance':
                    await handleAttendance(deviceId, message);
                    break;
                case 'session_update':
                    await handleSessionUpdate(deviceId, message);
                    break;
                default:
                    // Echo back unknown message types
                    ws.send(JSON.stringify({
                        type: 'echo',
                        payload: message
                    }));
            }
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
        if (deviceId) {
            connectedDevices.delete(deviceId);
            updateDeviceStatus(deviceId, 'OFFLINE', 'Device disconnected');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (deviceId) {
            updateDeviceStatus(deviceId, 'ERROR', 'WebSocket error');
        }
    });
});

async function handleCommandResult(deviceId, message) {
    try {
        console.log(`Processing command result for device ${deviceId}:`, message);
        
        // Find the latest pending command for this device
        const latestCommand = await prisma.deviceCommand.findFirst({
            where: { 
                deviceId,
                status: 'pending'
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (latestCommand) {
            const result = message.success ? JSON.stringify(message.data || {}) : null;
            const error = message.success ? null : (message.data?.error || 'Command failed');
            
            await prisma.deviceCommand.update({
                where: { id: latestCommand.id },
                data: {
                    status: message.success ? 'completed' : 'failed',
                    result,
                    completedAt: new Date()
                }
            });
            
            console.log(`Command ${latestCommand.type} ${message.success ? 'completed' : 'failed'} for device ${deviceId}`);
        }
    } catch (error) {
        console.error('Error handling command result:', error);
    }
}

async function handleCommandAcknowledgment(deviceId, message) {
    try {
        console.log(`Command acknowledgment for device ${deviceId}:`, message);
        
        // Find the latest pending command for this device
        const latestCommand = await prisma.deviceCommand.findFirst({
            where: { 
                deviceId,
                status: 'pending'
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (latestCommand) {
            await prisma.deviceCommand.update({
                where: { id: latestCommand.id },
                data: {
                    status: message.success ? 'sent' : 'failed',
                    sentAt: new Date()
                }
            });
        }
    } catch (error) {
        console.error('Error handling command acknowledgment:', error);
    }
}

async function handleFingerprintResult(deviceId, message) {
    try {
        console.log(`Fingerprint result for device ${deviceId}:`, message);
        
        if (message.success && message.fingerprintId > 0) {
            // Update user with fingerprint ID
            await prisma.user.update({
                where: { id: message.userId },
                data: { 
                    fingerprintId: message.fingerprintId.toString(),
                    updatedAt: new Date()
                }
            });
            
            console.log(`Updated user ${message.userId} with fingerprint ID ${message.fingerprintId}`);
        }
        
        // Also handle as command result
        await handleCommandResult(deviceId, {
            ...message,
            type: 'command_result',
            command: 'enroll_fingerprint',
            data: message.success ? {
                fingerprintId: message.fingerprintId.toString(),
                userId: message.userId
            } : { error: 'Fingerprint enrollment failed' }
        });
    } catch (error) {
        console.error('Error handling fingerprint result:', error);
    }
}

async function handleRfidResult(deviceId, message) {
    try {
        console.log(`RFID result for device ${deviceId}:`, message);
        
        if (message.success && message.cardId) {
            // Update user with RFID UID
            // Note: This would need the userId from the context
            // For now, we'll just log it
            console.log(`RFID card ${message.cardId} scanned successfully`);
        }
    } catch (error) {
        console.error('Error handling RFID result:', error);
    }
}

async function handleAttendance(deviceId, message) {
    try {
        console.log(`Attendance record for device ${deviceId}:`, message);
        
        // Process attendance record
        const data = message.data;
        if (data && data.userId && data.sessionId) {
            await prisma.attendanceRecord.create({
                data: {
                    sessionId: data.sessionId,
                    deviceId: deviceId,
                    studentId: data.userId,
                    type: data.method === 'fingerprint' ? 'IN' : 'IN',
                    verificationMethod: data.method.toUpperCase(),
                    status: 'PENDING'
                }
            });
            
            console.log(`Created attendance record for user ${data.userId}`);
        }
    } catch (error) {
        console.error('Error handling attendance:', error);
    }
}

async function handleSessionUpdate(deviceId, message) {
    try {
        console.log(`Session update for device ${deviceId}:`, message);
        
        // Update session status in database
        if (message.sessionId) {
            await prisma.attendanceSession.update({
                where: { id: message.sessionId },
                data: { 
                    status: message.status.toUpperCase(),
                    updatedAt: new Date()
                }
            });
            
            console.log(`Updated session ${message.sessionId} status to ${message.status}`);
        }
    } catch (error) {
        console.error('Error handling session update:', error);
    }
}

async function updateDeviceStatus(deviceId, status, message) {
    try {
        await prisma.deviceStatus.create({
            data: {
                deviceId,
                status,
                message,
                timestamp: new Date()
            }
        });
        
        // Also update the device's lastSeen
        await prisma.device.updateMany({
            where: { deviceId },
            data: {
                lastSeen: new Date(),
                isOnline: status === 'ONLINE'
            }
        });
    } catch (error) {
        console.error('Error updating device status:', error);
    }
}

// Start the server on port 3001
server.listen(3001, () => {
    console.log('WebSocket server running on ws://localhost:3001');
}); 