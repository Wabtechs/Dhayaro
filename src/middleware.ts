import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dhayaro-dev-secret-key-change-in-production'
)

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/docs',
  '/test-accounts',
  '/audit-fonc',
  '/patient/login',
  '/forgot-password',
  '/api/v1/auth/login',
  '/api/v1/auth/patient-login',
  '/api/v1/auth/refresh',
  '/api/v1/audit-fonc',
]

const ROLE_ROUTES: Record<string, string[]> = {
  '/api/v1/users': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/facilities': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/audit': ['SUPER_ADMIN', 'ADMIN'],
  '/api/v1/reports': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'ACCOUNTANT'],
  '/api/v1/diseases': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'],
  '/api/v1/queue': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE'],
  '/api/v1/lab': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'LABORATORY'],
  '/api/v1/archives': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE', 'ARCHIVIST'],
  '/api/v1/notifications': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/patient': ['PATIENT'],
  '/api/v1/care-episodes': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'RECEPTIONIST', 'ARCHIVIST'],
  '/api/v1/clinical-knowledge-base': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'],
  '/api/v1/disease-statistics': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'],
  '/api/v1/therapeutic-protocols': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'],
  '/api/v1/patients': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/consultations': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/diagnostics': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'LABORATORY'],
  '/api/v1/treatments': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'PHARMACIST'],
  '/api/v1/prescriptions': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'PHARMACIST'],
  '/api/v1/clinical-cases': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'],
  '/api/v1/documents': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'LABORATORY', 'ARCHIVIST', 'RECEPTIONIST'],
  '/api/v1/settings': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/sync': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'RECEPTIONIST'],
  '/api/v1/help-images': ['SUPER_ADMIN'],
  '/api/v1/pharmacy': ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
  '/api/v1/hospitalization': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'],
  '/api/v1/dashboard': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'RECEPTIONIST', 'LABORATORY', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/equipment': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/supplies': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/auth/me': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'RECEPTIONIST', 'LABORATORY', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST', 'PATIENT'],
  '/api/v1/care-coverages': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/notification-preferences': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/partner-companies': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/partner-patients': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'],
   '/api/v1/patient-history': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE', 'LABORATORY', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST'],
  '/api/v1/billing': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  '/api/v1/invoices': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'ACCOUNTANT'],
  '/api/v1/billing-codes': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  '/api/v1/payments': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
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

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

const isDev = process.env.NODE_ENV === 'development'

function applyHeaders(response: NextResponse, isApi: boolean): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  if (isDev && isApi) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return response
}

function createApiError(status: number, message: string, code: string): NextResponse {
  return NextResponse.json(
    { success: false, message, code, errors: {}, data: null },
    { status }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (isApi && request.method === 'OPTIONS') {
    return applyHeaders(NextResponse.json({}), true)
  }

  if (isPublicPath(pathname)) {
    return applyHeaders(NextResponse.next(), isApi)
  }

  if (isApi) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return applyHeaders(createApiError(401, 'Connexion requise. Veuillez vous reconnecter.', 'SESSION_EXPIRED'), true)
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      const allowedRoles = getAllowedRoles(pathname)
      if (allowedRoles) {
        const userRole = payload.role as string
        if (!allowedRoles.includes(userRole)) {
          return applyHeaders(
            createApiError(403, 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.', 'ACCESS_DENIED'),
            true
          )
        }
      }

      return applyHeaders(NextResponse.next(), true)
    } catch {
      return applyHeaders(createApiError(401, 'Votre session n\'est plus valide. Veuillez vous reconnecter.', 'SESSION_EXPIRED'), true)
    }
  }

  const token = request.cookies.get('dhayaro_token')?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    return applyHeaders(response, false)
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return applyHeaders(NextResponse.next(), false)
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('dhayaro_token')
    return applyHeaders(response, false)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon\\.png|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|logo-light-mode\\.png|logo-dark-mode\\.png|hero-illustration\\.png|about-illustration\\.png|logo-full\\.png|logo\\.png|manifest\\.json|sw\\.js|workbox.*|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
