import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import WebSocket from 'ws'

// Helper to send command to WebSocket server
async function sendToWebSocketServer(deviceId: string, command: string, parameters: any = {}) {
  return new Promise((resolve, reject) => {
    console.log('[API] Connecting to hardware WebSocket...');
    const ws = new WebSocket(`ws://localhost:4011/api/ws?deviceId=${encodeURIComponent(deviceId)}`);
    ws.on('open', () => {
      console.log('[API] Connected to hardware WebSocket, sending command...');
      ws.send(JSON.stringify({
        type: 'device_command',
        deviceId,
        command,
        parameters
      }));
      console.log('[API] Command sent to hardware WebSocket.');
      ws.close();
      resolve(true);
    });
    ws.on('error', (err) => {
      console.error('[API] Error connecting to hardware WebSocket:', err);
      reject(err);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { deviceId, command, parameters } = await req.json()

    if (!deviceId || !command) {
      return NextResponse.json({ error: 'Device ID and command are required' }, { status: 400 })
    }

    // Create a command record in the database
    const deviceCommand = await prisma.deviceCommand.create({
      data: {
        deviceId,
        type: command,
        parameters: JSON.stringify(parameters),
        status: 'pending'
      }
    })

    // Forward the command to the WebSocket server
    await sendToWebSocketServer(deviceId, command, parameters)

    return NextResponse.json({
      success: true,
      commandId: deviceCommand.id,
      message: `Command ${command} sent to device ${deviceId}`
    })

  } catch (error) {
    console.error('Error sending device command:', error)
    return NextResponse.json({ error: 'Failed to send device command' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    // Get pending commands for this device
    const commands = await prisma.deviceCommand.findMany({
      where: {
        deviceId: deviceId,
        status: 'pending'
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 10 // Limit to 10 commands at a time
    })

    // Mark commands as processed
    if (commands.length > 0) {
      await prisma.deviceCommand.updateMany({
        where: {
          id: {
            in: commands.map(cmd => cmd.id)
          }
        },
        data: {
          status: 'PROCESSED',
          completedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      commands: commands.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        parameters: cmd.parameters,
        createdAt: cmd.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching device commands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 