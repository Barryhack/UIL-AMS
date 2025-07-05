import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    // Get the most recent command for the device
    const latestCommand = await prisma.deviceCommand.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    })

    if (!latestCommand) {
      return NextResponse.json({ 
        status: 'no_command',
        message: 'No commands found for this device'
      })
    }

    // Only return the real status and result from the database
    let status = latestCommand.status
    let result = null
    let error = null

    if (latestCommand.result) {
      try {
        result = JSON.parse(latestCommand.result)
      } catch {
        result = latestCommand.result
      }
    }

    return NextResponse.json({
      status,
      result,
      error,
      commandId: latestCommand.id,
      commandType: latestCommand.type,
      createdAt: latestCommand.createdAt
    })

  } catch (error) {
    console.error('Error checking command status:', error)
    return NextResponse.json({ error: 'Failed to check command status' }, { status: 500 })
  }
} 