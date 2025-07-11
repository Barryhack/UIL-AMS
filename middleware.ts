import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Add paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/login',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/verify',
  '/ping',
  '/api/ping',
  '/api/hardware/sync',
  '/api/device/commands',
  '/api/device/attendance',
  '/api/device/register',
  '/api/device/status',
  '/api/device/heartbeat',
  '/api/device/sync',
  '/api/device/verify',
  '/api/device/record-attendance',
  '/api/device/commands',
  '/api/ws'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Allow public paths and NextAuth API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // If there's no token, redirect to login
  if (!token) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(url)
  }

  // Handle role-based access
  const role = token.role?.toLowerCase()
  const isAccessingRoleSpecificPath = pathname.startsWith('/admin') || 
                                    pathname.startsWith('/lecturer') || 
                                    pathname.startsWith('/student')

  // If accessing a role-specific path, check if user has correct role
  if (isAccessingRoleSpecificPath) {
    const userRolePath = `/${role}`
    
    // If user is trying to access a different role's path, redirect to their dashboard
    if (!pathname.startsWith(userRolePath)) {
      return NextResponse.redirect(new URL(`${userRolePath}/dashboard`, request.url))
    }
    
    // If user is accessing their own role's path, allow it (including sub-paths)
    return NextResponse.next()
  }

  // For non-role-specific paths, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets
     * - device API routes (for ESP32 communication)
     */
    '/((?!api/ping|api/ws|api/device|_next/static|_next/image|favicon.ico|images|assets|public).*)',
  ],
}
