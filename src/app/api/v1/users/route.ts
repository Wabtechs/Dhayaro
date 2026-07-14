import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSql } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = [eq(users.isActive, true)]
    if (search) {
      conditions.push(or(
        ilike(users.firstname, `%${search}%`),
        ilike(users.lastname, `%${search}%`),
        ilike(users.email, `%${search}%`),
      )!)
    }

    const whereClause = and(...conditions)

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(users)
      .where(whereClause)

    const items = await getDb()
      .select({
        id: users.id,
        facilityId: users.facilityId,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        facilityName: facilities.name,
        facilityType: facilities.facilityType,
      })
      .from(users)
      .leftJoin(facilities, eq(users.facilityId, facilities.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(size)
      .offset(offset)

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.email || !body.firstname || !body.lastname || !body.role) {
      return NextResponse.json({ detail: 'email, firstname, lastname, and role are required' }, { status: 400 })
    }

    if (!body.password) {
      return NextResponse.json({ detail: 'password is required' }, { status: 400 })
    }

    const validRoles = ['ADMIN', 'DOCTOR', 'RESEARCHER', 'NURSE', 'VIEWER']
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ detail: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
    }

    const passwordHash = await hashPassword(body.password)
    const sql = getSql()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const facilityId = sanitizeUuid(body.facilityId)

    const rows = await sql`
      INSERT INTO users (id, email, firstname, lastname, role, facility_id, password_hash, is_active, created_at, updated_at)
      VALUES (${id}, ${body.email}, ${body.firstname}, ${body.lastname}, ${body.role}, ${facilityId}, ${passwordHash}, true, ${now}, ${now})
      RETURNING id, facility_id, firstname, lastname, email, role, is_active, created_at, updated_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
    console.error('POST /users error:', e)
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ detail: 'Internal server error', error: msg }, { status: 500 })
  }
}
