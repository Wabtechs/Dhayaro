import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/patient/login',
  '/forgot-password',
  '/api/v1/auth/login',
  '/api/v1/auth/patient-login',
  '/api/v1/auth/refresh',
]

const ROLE_ROUTES: Record<string, string[]> = {
  '/api/v1/users': ['SUPER_ADMIN', 'ADMIN'],
  '/api/v1/facilities': ['SUPER_ADMIN', 'ADMIN'],
  '/api/v1/audit': ['SUPER_ADMIN', 'ADMIN'],
  '/api/v1/reports': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'ACCOUNTANT'],
  '/api/v1/diseases': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'],
  '/api/v1/queue': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE'],
  '/api/v1/lab': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'LABORATORY'],
  '/api/v1/archives': ['SUPER_ADMIN', 'ADMIN', 'ARCHIVIST'],
  '/api/v1/notifications': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/patient': ['PATIENT'],
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
        process.env.JWT_SECRET || 'dhayaro-dev-secret-key-change-in-production'
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

  const token = request.cookies.get('dhayaro_token')?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'dhayaro-dev-secret-key-change-in-production'
    )
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('dhayaro_token')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon\\.png|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|logo-light-mode\\.png|logo-dark-mode\\.png|hero-illustration\\.png|about-illustration\\.png|logo-full\\.png|logo\\.png|manifest\\.json|sw\\.js|workbox.*|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
