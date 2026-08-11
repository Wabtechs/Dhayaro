import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: JWT_SECRET is not set in production!')
    }
    return new TextEncoder().encode('dhayaro-dev-secret-key-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

const JWT_SECRET = getJwtSecret()

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { sub: string; email: string; role: string; facilityId?: string | null; firstname?: string; lastname?: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function createRefreshToken(payload: { sub: string; email: string; role: string; facilityId?: string | null; firstname?: string; lastname?: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string; role: string; facilityId?: string | null; firstname?: string; lastname?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      facilityId: (payload.facilityId as string) || null,
      firstname: (payload.firstname as string) || undefined,
      lastname: (payload.lastname as string) || undefined,
    }
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

export type AuthUser = { sub: string; email: string; role: string; facilityId?: string | null; firstname?: string; lastname?: string }

export async function requireAuth(request: NextRequest): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { error: NextResponse.json({ success: false, message: 'Connexion requise. Veuillez vous reconnecter.', code: 'SESSION_EXPIRED', errors: {}, data: null }, { status: 401 }) }
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return { error: NextResponse.json({ success: false, message: 'Votre session n\'est plus valide. Veuillez vous reconnecter.', code: 'SESSION_EXPIRED', errors: {}, data: null }, { status: 401 }) }
  }
  return { user: payload }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  const result = await requireAuth(request)
  if ('error' in result) return result
  if (!allowedRoles.includes(result.user.role)) {
    return { error: NextResponse.json({ success: false, message: 'Votre compte ne dispose pas des autorisations nécessaires pour effectuer cette action.', code: 'ACCESS_DENIED', errors: {}, data: null }, { status: 403 }) }
  }
  return result
}
