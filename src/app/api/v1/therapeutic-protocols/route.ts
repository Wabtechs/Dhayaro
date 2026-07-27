import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { therapeuticProtocols, diseases } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(therapeuticProtocols.name, `%${search}%`),
        ilike(therapeuticProtocols.description, `%${search}%`),
      )!)
    }

    const diseaseId = sanitizeUuid(searchParams.get('diseaseId'))
    if (diseaseId) conditions.push(eq(therapeuticProtocols.diseaseId, diseaseId))

    const facilityFilter = addFacilityFilter(therapeuticProtocols.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(therapeuticProtocols).where(whereClause),
      getDb().select({
        id: therapeuticProtocols.id,
        facilityId: therapeuticProtocols.facilityId,
        diseaseId: therapeuticProtocols.diseaseId,
        name: therapeuticProtocols.name,
        description: therapeuticProtocols.description,
        steps: therapeuticProtocols.steps,
        targetPopulation: therapeuticProtocols.targetPopulation,
        contraindications: therapeuticProtocols.contraindications,
        efficacyRate: therapeuticProtocols.efficacyRate,
        isActive: therapeuticProtocols.isActive,
        createdBy: therapeuticProtocols.createdBy,
        createdAt: therapeuticProtocols.createdAt,
        updatedAt: therapeuticProtocols.updatedAt,
        diseaseName: diseases.name,
        diseaseCode: diseases.code,
      })
      .from(therapeuticProtocols)
      .leftJoin(diseases, eq(therapeuticProtocols.diseaseId, diseases.id))
      .where(whereClause)
      .orderBy(desc(therapeuticProtocols.createdAt))
      .limit(size)
      .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /therapeutic-protocols', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.name) return apiError(400, 'name is required')

    const db = getDb()
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const diseaseId = sanitizeUuid(body.diseaseId)

    const [row] = await db.insert(therapeuticProtocols).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      diseaseId: diseaseId || null,
      name: body.name,
      description: body.description || null,
      steps: body.steps || [],
      targetPopulation: body.targetPopulation || null,
      contraindications: body.contraindications || [],
      efficacyRate: body.efficacyRate ?? null,
      isActive: body.isActive ?? true,
      createdBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /therapeutic-protocols', e)
    return apiError(500, 'Internal server error')
  }
}
