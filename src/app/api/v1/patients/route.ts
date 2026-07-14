import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = [eq(patients.isActive, true)]
    if (search) {
      conditions.push(or(
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
        ilike(patients.email, `%${search}%`),
        ilike(patients.patientUuid, `%${search}%`),
      )!)
    }

    const whereClause = and(...conditions)

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(patients)
      .where(whereClause)

    const items = await getDb()
      .select()
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients.createdAt))
      .limit(size)
      .offset(offset)

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    return NextResponse.json({ detail: 'Internal server error', message: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.patientUuid) {
      body.patientUuid = crypto.randomUUID()
    }

    if (body.facilityId) {
      const facilityCheck = await getDb().select({ id: facilities.id }).from(facilities).where(eq(facilities.id, body.facilityId)).limit(1)
      if (facilityCheck.length === 0) {
        return NextResponse.json({ detail: 'Facility not found' }, { status: 400 })
      }
    }

    const [created] = await getDb().insert(patients).values(body).returning()

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ detail: 'Internal server error', message: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
