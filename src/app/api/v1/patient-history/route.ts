import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patientHistory, patients, careEpisodes } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiErrorResponse, handleEndpointError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, patientHistoryCreateSchema, patientHistoryUpdateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(patientHistory.title, `%${search}%`),
        ilike(patientHistory.description, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const episodeId = sanitizeUuid(searchParams.get('episodeId'))
    const eventType = searchParams.get('eventType')

    if (patientId) conditions.push(eq(patientHistory.patientId, patientId))
    if (episodeId) conditions.push(eq(patientHistory.episodeId, episodeId))
    if (eventType) conditions.push(eq(patientHistory.eventType, eventType))

    const facilityFilter = addFacilityFilter(patientHistory.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(patientHistory).where(whereClause),
      getDb().select({
        id: patientHistory.id,
        facilityId: patientHistory.facilityId,
        patientId: patientHistory.patientId,
        episodeId: patientHistory.episodeId,
        eventType: patientHistory.eventType,
        title: patientHistory.title,
        description: patientHistory.description,
        performedBy: patientHistory.performedBy,
        performedByName: patientHistory.performedByName,
        metadata: patientHistory.metadata,
        createdAt: patientHistory.createdAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        episodeNumber: careEpisodes.episodeNumber,
      })
      .from(patientHistory)
      .leftJoin(patients, eq(patientHistory.patientId, patients.id))
      .leftJoin(careEpisodes, eq(patientHistory.episodeId, careEpisodes.id))
      .where(whereClause)
      .orderBy(desc(patientHistory.createdAt))
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
return handleEndpointError(e, 'GET /patient-history')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, patientHistoryCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, body.patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: 'Patient introuvable.' })
    }

    const [row] = await db.insert(patientHistory).values({
      facilityId: facilityId || null,
      patientId: body.patientId,
      episodeId: body.episodeId || null,
      eventType: body.eventType,
      title: body.title,
      description: body.description || null,
      performedBy: body.performedBy || null,
      performedByName: body.performedByName || null,
      metadata: body.metadata || {},
createdAt: now,
      } as any).returning()

    await logAudit(auth.user, 'CREATE', 'patient_history', row.id, { patientId: row.patientId, eventType: row.eventType })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    return handleEndpointError(e, 'POST /patient-history')
  }
}