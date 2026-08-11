import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, createRefreshToken, verifyPassword } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { checkRateLimit, getRateLimitKey, cleanupRateLimit } from '@/lib/rate-limit'
import { parseJsonBody, authLoginSchema } from '@/lib/api-schemas'

const LOGIN_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 }

export async function POST(request: NextRequest) {
  cleanupRateLimit()

  const rateLimitKey = getRateLimitKey(request, 'login')
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT.maxRequests, LOGIN_RATE_LIMIT.windowMs)

  if (!allowed) {
    return NextResponse.json(
      { success: false, message: 'Vous avez effectué trop de tentatives. Veuillez patienter avant de réessayer.', code: 'RATE_LIMIT_EXCEEDED', errors: {}, data: null },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  try {
    const parsed = await parseJsonBody(request, authLoginSchema)
    if (parsed.ok === false) return parsed.error
    const { email, password } = parsed.body

    const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Adresse e-mail ou mot de passe incorrect.', code: 'AUTHENTICATION_FAILED', errors: {}, data: null },
        { status: 401 }
      )
    }

    const user = rows[0]
    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Adresse e-mail ou mot de passe incorrect.', code: 'AUTHENTICATION_FAILED', errors: {}, data: null },
        { status: 401 }
      )
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
      firstname: user.firstname,
      lastname: user.lastname,
    })

    const refreshToken = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
      firstname: user.firstname,
      lastname: user.lastname,
    })

    await logAudit({ sub: user.id, email: user.email, role: user.role, facilityId: user.facilityId || null, firstname: user.firstname, lastname: user.lastname }, 'LOGIN', 'auth', user.id, { email: user.email })

    const response = NextResponse.json({
      access_token: token,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    })

    response.cookies.set('dhayaro_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })
    response.cookies.set('dhayaro_refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.', code: 'SERVER_ERROR', errors: {}, data: null },
      { status: 500 }
    )
  }
}
