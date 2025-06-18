import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const GET = async (req: Request) => {
  const headersList = headers();
  const deviceId = headersList.get('x-device-id');
  const macAddress = headersList.get('x-mac-address');
  const apiKey = headersList.get('x-api-key');

  // Validate required headers
  if (!deviceId || !macAddress) {
    return new NextResponse('Missing required headers', { status: 400 });
  }

  // For WebSocket upgrade - Note: Vercel has limited WebSocket support
  if (req.headers.get('upgrade') !== 'websocket') {
    return new NextResponse('Expected WebSocket connection', { status: 426 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const protocol = searchParams.get('protocol') || '';

    // Create response to upgrade the connection
    const responseHeaders = new Headers({
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': 'accepted',
      'Sec-WebSocket-Protocol': protocol
    });

    // Log connection attempt
    console.log(`WebSocket connection attempt from device: ${deviceId} (${macAddress})`);

    return new NextResponse(null, {
      status: 101,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('WebSocket connection error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

// Handle POST requests for device communication (fallback for Vercel)
export const POST = async (req: Request) => {
  const headersList = headers();
  const deviceId = headersList.get('x-device-id');
  const macAddress = headersList.get('x-mac-address');
  const apiKey = headersList.get('x-api-key');

  if (!deviceId || !macAddress) {
    return new NextResponse('Missing required headers', { status: 400 });
  }

  try {
    const body = await req.json();
    console.log(`Device message from ${deviceId}:`, body);

    // Handle different message types
    switch (body.type) {
      case 'hello':
        return NextResponse.json({
          type: 'welcome',
          message: 'Connected to UNILORIN AMS API',
          timestamp: new Date().toISOString()
        });
      case 'rfid_scan':
        return NextResponse.json({
          type: 'scan_received',
          uid: body.uid,
          timestamp: new Date().toISOString()
        });
      default:
        return NextResponse.json({
          type: 'ack',
          message: 'Message received',
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error processing device message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}; 