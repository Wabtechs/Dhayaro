import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
]

const ROLE_ROUTES: Record<string, string[]> = {
  '/api/v1/users': ['ADMIN'],
  '/api/v1/facilities': ['ADMIN'],
  '/api/v1/audit': ['ADMIN'],
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function getAllowedRoles(pathname: string): string[] | null {
  for (const [path, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return roles
    }
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'medinsight-dev-secret-key-change-in-production'
      )
      const { payload } = await jwtVerify(token, secret)

      const allowedRoles = getAllowedRoles(pathname)
      if (allowedRoles) {
        const userRole = payload.role as string
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { detail: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      return NextResponse.next()
    } catch {
      return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 })
    }
  }

  const token = request.cookies.get('medinsight_token')?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'medinsight-dev-secret-key-change-in-production'
    )
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('medinsight_token')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-full.png|logo.png|manifest.json|sw.js|workbox.*).*)',
  ],
}
