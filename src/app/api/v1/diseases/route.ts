import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diseases } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = [eq(diseases.isActive, true)]
    if (search) {
      conditions.push(or(
        ilike(diseases.code, `%${search}%`),
        ilike(diseases.name, `%${search}%`),
        ilike(diseases.category, `%${search}%`),
      )!)
    }

    const category = searchParams.get('category')
    if (category) {
      conditions.push(eq(diseases.category, category))
    }

    const whereClause = and(...conditions)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(diseases).where(whereClause),
      getDb().select().from(diseases).where(whereClause).orderBy(desc(diseases.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /diseases', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.code) {
      return apiError(400, 'code is required')
    }
    if (!body.name) {
      return apiError(400, 'name is required')
    }
    if (!body.category) {
      return apiError(400, 'category is required')
    }

    const db = getDb()

    const [existing] = await db.select({ id: diseases.id }).from(diseases).where(eq(diseases.code, body.code)).limit(1)
    if (existing) {
      return apiError(400, 'Disease code already exists')
    }

    const now = new Date()

    const [row] = await db.insert(diseases).values({
      id: crypto.randomUUID(),
      code: body.code,
      name: body.name,
      category: body.category,
      description: body.description || null,
      symptoms: body.symptoms || [],
      complications: body.complications || [],
      treatments: body.treatments || [],
      isContagious: body.isContagious ?? false,
      severity: body.severity || 'MODERATE',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /diseases', e)
    return apiError(500, 'Internal server error')
  }
}
