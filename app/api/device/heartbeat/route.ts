import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { deviceId, timestamp, rssi, ipAddress } = data;

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
        }

        // Update or create device status
        const device = await prisma.device.upsert({
            where: { deviceId },
            update: {
                lastSeen: new Date(),
                rssi,
                ipAddress,
                status: 'online'
            },
            create: {
                deviceId,
                lastSeen: new Date(),
                rssi,
                ipAddress,
                status: 'online'
            }
        });

        return NextResponse.json({ success: true, device });
    } catch (error) {
        console.error('Error handling device heartbeat:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 