import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSql } from '@/lib/db'
import { facilities } from '@/lib/schema'
import { eq, desc, ilike, and, count } from 'drizzle-orm'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = [eq(facilities.isActive, true)]
    if (search) {
      conditions.push(ilike(facilities.name, `%${search}%`))
    }

    const whereClause = and(...conditions)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(facilities).where(whereClause),
      getDb().select().from(facilities).where(whereClause).orderBy(desc(facilities.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /facilities', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.name || !body.code || !body.facilityType) {
      return apiError(400, 'name, code, and facilityType are required')
    }

    const validTypes = ['HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY']
    if (!validTypes.includes(body.facilityType)) {
      return apiError(400, `facilityType must be one of: ${validTypes.join(', ')}`)
    }

    const sql = getSql()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const rows = await sql`
      INSERT INTO facilities (id, name, code, facility_type, address, city, phone, email, bed_count, is_active, created_at, updated_at)
      VALUES (${id}, ${body.name}, ${body.code}, ${body.facilityType}, ${body.address || null}, ${body.city || null}, ${body.phone || null}, ${body.email || null}, ${body.bedCount || 0}, true, ${now}, ${now})
      RETURNING id, name, code, facility_type, address, city, phone, email, bed_count, department_count, staff_count, is_active, created_at, updated_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
    logError('POST /facilities', e)
    return apiError(500, 'Internal server error')
  }
}
