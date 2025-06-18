import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { deviceId, status, message, timestamp } = data;

        if (!deviceId || !status) {
            return NextResponse.json({ error: 'Device ID and status are required' }, { status: 400 });
        }

        // Log device status
        const deviceStatus = await prisma.deviceStatus.create({
            data: {
                deviceId,
                status,
                message: message || '',
                timestamp: new Date()
            }
        });

        // Update device's current status
        await prisma.device.update({
            where: { deviceId },
            data: {
                status,
                lastStatusMessage: message || '',
                lastSeen: new Date()
            }
        });

        return NextResponse.json({ success: true, deviceStatus });
    } catch (error) {
        console.error('Error updating device status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 