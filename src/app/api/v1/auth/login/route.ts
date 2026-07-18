import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, verifyPassword } from '@/lib/auth'

const MOCK_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'admin@dhayaro.cd', password: 'admin123', firstname: 'Jean-Pierre', lastname: 'Lukusa', role: 'ADMIN' as const },
  { id: '00000000-0000-0000-0000-000000000002', email: 'dr.kabongo@dhayaro.cd', password: 'doctor123', firstname: 'Patrice', lastname: 'Kabongo', role: 'DOCTOR' as const },
  { id: '00000000-0000-0000-0000-000000000003', email: 'nurse.consolee@dhayaro.cd', password: 'nurse123', firstname: 'Consolée', lastname: 'Bakonga', role: 'NURSE' as const },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 })
    }

    let user: { id: string; email: string; firstname: string; lastname: string; role: string; facility_id?: string | null; passwordHash?: string } | null = null

    try {
      const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
      if (rows.length > 0) {
        user = rows[0] as typeof user
      }
    } catch {
      const mock = MOCK_USERS.find((m) => m.email === email)
      if (mock && password === mock.password) {
        user = { id: mock.id, email: mock.email, firstname: mock.firstname, lastname: mock.lastname, role: mock.role }
      } else {
        return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
      }
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
      facilityId: user.facility_id || null,
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
