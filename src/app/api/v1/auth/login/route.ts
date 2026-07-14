import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, verifyPassword } from '@/lib/auth'

const MOCK_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'admin@medinsight.dz', password: 'admin123', firstname: 'Admin', lastname: 'System', role: 'ADMIN' as const },
  { id: '00000000-0000-0000-0000-000000000002', email: 'dr.benali@medinsight.dz', password: 'doctor123', firstname: 'Karim', lastname: 'Benali', role: 'DOCTOR' as const },
  { id: '00000000-0000-0000-0000-000000000003', email: 'researcher@medinsight.dz', password: 'researcher123', firstname: 'Amina', lastname: 'Hadj', role: 'RESEARCHER' as const },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 })
    }

    let user: { id: string; email: string; firstname: string; lastname: string; role: string; facility_id?: string | null } | null = null

    try {
      const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
      if (rows.length > 0) {
        user = rows[0]
      }
    } catch {
      // DB connection failed — fall back to mock users
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

    // If user came from DB, verify password with bcrypt
    if (!MOCK_USERS.find((m) => m.email === email)) {
      const valid = await verifyPassword(password, user && 'passwordHash' in user ? (user as { passwordHash: string }).passwordHash : '')
      if (!valid) {
        return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
      }
    }

    const token = await createToken({ sub: user.id, email: user.email, role: user.role })

    return NextResponse.json({
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
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
