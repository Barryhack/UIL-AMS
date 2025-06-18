import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { deviceId: string } }
) {
    try {
        const { deviceId } = params;

        // Get pending commands for the device
        const commands = await prisma.deviceCommand.findMany({
            where: {
                deviceId,
                status: 'pending'
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Parse parameters and result back to objects
        const parsedCommands = commands.map(cmd => ({
            ...cmd,
            parameters: cmd.parameters ? JSON.parse(cmd.parameters) : null,
            result: cmd.result ? JSON.parse(cmd.result) : null
        }));

        // Mark commands as sent
        if (commands.length > 0) {
            await prisma.deviceCommand.updateMany({
                where: {
                    id: {
                        in: commands.map(cmd => cmd.id)
                    }
                },
                data: {
                    status: 'sent',
                    sentAt: new Date()
                }
            });
        }

        return NextResponse.json({ commands: parsedCommands });
    } catch (error) {
        console.error('Error fetching device commands:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Endpoint to add new commands for a device
export async function POST(
    request: Request,
    { params }: { params: { deviceId: string } }
) {
    try {
        const { deviceId } = params;
        const data = await request.json();
        const { type, parameters } = data;

        if (!type) {
            return NextResponse.json({ error: 'Command type is required' }, { status: 400 });
        }

        const command = await prisma.deviceCommand.create({
            data: {
                deviceId,
                type,
                parameters: parameters ? JSON.stringify(parameters) : null,
                status: 'pending'
            }
        });

        return NextResponse.json({ 
            success: true, 
            command: {
                ...command,
                parameters: parameters || null
            }
        });
    } catch (error) {
        console.error('Error creating device command:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 