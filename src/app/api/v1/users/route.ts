import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, count } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = [eq(users.isActive, true)]
    if (search) {
      conditions.push(ilike(users.firstname, `%${search}%`))
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

    if (body.password) {
      body.passwordHash = await hashPassword(body.password)
      delete body.password
    }

    const [created] = await getDb().insert(users).values(body).returning()

    const { passwordHash: _, ...safe } = created as Record<string, unknown>
    return NextResponse.json(safe, { status: 201 })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
