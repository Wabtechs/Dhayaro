import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 })
    }

    let user: { id: string; email: string; firstname: string; lastname: string; role: string; facility_id?: string | null; passwordHash?: string } | null = null

    const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
    if (rows.length > 0) {
      user = rows[0] as typeof user
    }

    if (!user) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
    }

    if (user.passwordHash) {
      const valid = await verifyPassword(password, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
      }
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: (user as any).facilityId || (user as any).facility_id || null,
    })

    const response = NextResponse.json({
      access_token: token,
      refresh_token: token,
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
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
