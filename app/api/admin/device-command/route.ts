import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, type, data } = body;

    if (!deviceId || !type) {
      return NextResponse.json({ error: 'Device ID and type are required' }, { status: 400 });
    }

    // Create the command
    const command = await prisma.deviceCommand.create({
      data: {
        deviceId,
        type,
        parameters: JSON.stringify(data || {}),
        status: 'pending'
      }
    });

    console.log(`[Admin] Created command for device ${deviceId}:`, {
      commandId: command.id,
      type,
      data
    });

    return NextResponse.json({
      success: true,
      command: {
        id: command.id,
        type: command.type,
        parameters: command.parameters,
        status: command.status,
        createdAt: command.createdAt
      }
    });

  } catch (error) {
    console.error('[Admin] Error creating device command:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    // Get recent commands for this device
    const commands = await prisma.deviceCommand.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      commands: commands.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        parameters: cmd.parameters,
        status: cmd.status,
        createdAt: cmd.createdAt,
        completedAt: cmd.completedAt,
        result: cmd.result
      }))
    });

  } catch (error) {
    console.error('[Admin] Error fetching device commands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 