import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diseases } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { apiErrorResponse, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { parseJsonBody, diseaseCreateSchema } from '@/lib/api-schemas'

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
return handleEndpointError(e, 'GET /diseases')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, diseaseCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()

    const [existing] = await db.select({ id: diseases.id }).from(diseases).where(eq(diseases.code, body.code)).limit(1)
    if (existing) {
      return apiErrorResponse('RESOURCE_ALREADY_EXISTS', 409, { code: 'Ce code de maladie existe déjà.' })
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
return handleEndpointError(e, 'POST /diseases')
  }
}
