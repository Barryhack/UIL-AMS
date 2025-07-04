import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: "Server is running!", 
    timestamp: new Date().toISOString(),
    status: "ok"
  })
}

export const OPTIONS = async () => {
  const response = new NextResponse(null, { status: 204 })
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
} 