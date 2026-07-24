import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, createRefreshToken, verifyPassword } from '@/lib/auth'
import { checkRateLimit, getRateLimitKey, cleanupRateLimit } from '@/lib/rate-limit'

const LOGIN_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 }

export async function POST(request: NextRequest) {
  cleanupRateLimit()

  const rateLimitKey = getRateLimitKey(request, 'login')
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT.maxRequests, LOGIN_RATE_LIMIT.windowMs)

  if (!allowed) {
    return NextResponse.json(
      { detail: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 })
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ detail: 'Invalid input format' }, { status: 400 })
    }

    const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
    if (rows.length === 0) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
    }

    const user = rows[0]
    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
    })

    const refreshToken = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
    })

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

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ detail: 'Internal server error', error: msg }, { status: 500 })
  }
}
