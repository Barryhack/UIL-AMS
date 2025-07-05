import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, type, identifier, success, timestamp } = body;

    if (!deviceId || !type) {
      return NextResponse.json({ error: 'Device ID and type are required' }, { status: 400 });
    }

    console.log(`[Device Attendance] Received ${type} record from device ${deviceId}:`, {
      identifier,
      success,
      timestamp
    });

    // Find the device
    const device = await prisma.device.findUnique({
      where: { deviceId }
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Find active session for this device
    const activeSession = await prisma.attendanceSession.findFirst({
      where: {
        deviceId: device.id,
        status: 'ACTIVE',
        startTime: { lte: new Date() },
        endTime: { gte: new Date() }
      },
      include: {
        course: true
      }
    });

    if (!activeSession) {
      console.log(`[Device Attendance] No active session found for device ${deviceId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'No active session',
        sessionActive: false 
      });
    }

    // Find user by identifier
    let user = null;
    if (identifier && identifier.length > 0) {
      if (type === 'fingerprint') {
        // Find user by fingerprint ID
        user = await prisma.user.findFirst({
          where: { fingerprintId: identifier }
        });
      } else if (type === 'rfid') {
        // Find user by RFID UID
        user = await prisma.user.findFirst({
          where: { rfidUid: identifier }
        });
      }
    }

    if (!user) {
      console.log(`[Device Attendance] User not found for identifier: ${identifier}`);
      return NextResponse.json({ 
        success: true, 
        message: 'User not found',
        userFound: false 
      });
    }

    // Check if attendance already exists for this session and user
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        sessionId: activeSession.id,
        studentId: user.id
      }
    });

    if (existingRecord) {
      console.log(`[Device Attendance] Attendance already recorded for user ${user.id} in session ${activeSession.id}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Attendance already recorded',
        alreadyRecorded: true 
      });
    }

    // Create attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        sessionId: activeSession.id,
        deviceId: device.id,
        studentId: user.id,
        type: type.toUpperCase(),
        verificationMethod: type.toUpperCase(),
        status: 'VERIFIED',
        metadata: JSON.stringify({
          deviceId,
          success,
          timestamp,
          originalIdentifier: identifier
        })
      }
    });

    console.log(`[Device Attendance] Created attendance record:`, {
      recordId: attendanceRecord.id,
      userId: user.id,
      sessionId: activeSession.id,
      courseCode: activeSession.course.code
    });

    // Broadcast to WebSocket clients
    try {
      const { WebSocketServer } = await import('ws');
      const wss = (global as any).wss as WebSocketServer;
      
      if (wss) {
        const message = JSON.stringify({
          type: 'attendance_recorded',
          data: {
            recordId: attendanceRecord.id,
            sessionId: activeSession.id,
            courseId: activeSession.courseId,
            courseCode: activeSession.course.code,
            courseTitle: activeSession.course.title,
            studentId: user.id,
            studentName: user.name,
            matricNumber: user.matricNumber,
            verificationMethod: type.toUpperCase(),
            timestamp: attendanceRecord.timestamp
          }
        });

        wss.clients.forEach((client: any) => {
          if (client.readyState === WebSocketServer.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (wsError) {
      console.error('[Device Attendance] WebSocket broadcast error:', wsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      recordId: attendanceRecord.id,
      sessionActive: true,
      userFound: true,
      alreadyRecorded: false
    });

  } catch (error) {
    console.error('[Device Attendance] Error processing attendance record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 