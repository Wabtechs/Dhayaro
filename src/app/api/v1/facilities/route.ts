import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { facilities } from '@/lib/schema'
import { eq, desc, ilike, and, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = [eq(facilities.isActive, true)]
    if (search) {
      conditions.push(ilike(facilities.name, `%${search}%`))
    }

    const whereClause = and(...conditions)

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(facilities)
      .where(whereClause)

    const items = await getDb()
      .select()
      .from(facilities)
      .where(whereClause)
      .orderBy(desc(facilities.createdAt))
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

    if (!body.name || !body.code || !body.facilityType) {
      return NextResponse.json({ detail: 'name, code, and facilityType are required' }, { status: 400 })
    }

    const [created] = await getDb().insert(facilities).values(body).returning()

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
