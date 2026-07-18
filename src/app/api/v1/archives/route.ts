import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { archives, patients } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const entityType = searchParams.get('entityType')
    const patientId = sanitizeUuid(searchParams.get('patientId'))

    const conditions = []

    if (entityType) {
      conditions.push(eq(archives.entityType, entityType as 'CONSULTATION' | 'DIAGNOSTIC' | 'TREATMENT' | 'LAB_EXAM' | 'DOCUMENT' | 'PATIENT_FILE'))
    }
    if (patientId) {
      conditions.push(eq(archives.patientId, patientId))
    }

    if (auth.user.facilityId && ['DOCTOR', 'SPECIALIST', 'ARCHIVIST'].includes(auth.user.role)) {
      conditions.push(eq(archives.facilityId, auth.user.facilityId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(archives).where(whereClause),
      getDb()
        .select({
          id: archives.id,
          facilityId: archives.facilityId,
          entityType: archives.entityType,
          entityId: archives.entityId,
          patientId: archives.patientId,
          title: archives.title,
          summary: archives.summary,
          archivedBy: archives.archivedBy,
          data: archives.data,
          createdAt: archives.createdAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
        })
        .from(archives)
        .leftJoin(patients, eq(archives.patientId, patients.id))
        .where(whereClause)
        .orderBy(desc(archives.createdAt))
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
    logError('GET /archives', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.entityType || !body.entityId || !body.title) {
      return apiError(400, 'entityType, entityId, and title are required')
    }

    const now = new Date()

    const [row] = await getDb().insert(archives).values({
      id: crypto.randomUUID(),
      facilityId: auth.user.facilityId || null,
      entityType: body.entityType,
      entityId: body.entityId,
      patientId: sanitizeUuid(body.patientId) || null,
      title: body.title,
      summary: body.summary || null,
      archivedBy: auth.user.sub,
      data: body.data || {},
      createdAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /archives', e)
    return apiError(500, 'Internal server error')
  }
}
