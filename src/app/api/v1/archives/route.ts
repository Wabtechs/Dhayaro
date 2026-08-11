import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { archives, patients, users } from '@/lib/schema'
import { eq, desc, and, or, ilike, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { requireAuth } from '@/lib/auth'
import { parseJsonBody, archiveCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const entityType = searchParams.get('entityType')
    const patientId = sanitizeUuid(searchParams.get('patientId'))

    const conditions = []

    if (search) {
      conditions.push(or(
        ilike(archives.title, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    if (entityType) {
      conditions.push(eq(archives.entityType, entityType as 'CONSULTATION' | 'DIAGNOSTIC' | 'TREATMENT' | 'LAB_EXAM' | 'DOCUMENT' | 'PATIENT_FILE'))
    }
    if (patientId) {
      conditions.push(eq(archives.patientId, patientId))
    }

    const facilityFilter = addFacilityFilter(archives.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

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
          archivistFirstname: users.firstname,
          archivistLastname: users.lastname,
        })
        .from(archives)
        .leftJoin(patients, eq(archives.patientId, patients.id))
        .leftJoin(users, eq(archives.archivedBy, users.id))
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

    const parsed = await parseJsonBody(request, archiveCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()

    const [row] = await getDb().insert(archives).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      entityType: body.entityType,
      entityId: body.entityId,
      patientId: sanitizeUuid(body.patientId) || null,
      title: body.title,
      summary: body.summary || null,
      archivedBy: auth.user.sub,
      data: body.data || {},
      createdAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'archive', row.id, { entityType: row.entityType, entityId: row.entityId })

    if (row.patientId) {
      await logPatientEvent({
        facilityId: row.facilityId,
        patientId: row.patientId,
        eventType: 'ARCHIVE_CREATED',
        title: EVENT_TITLES.ARCHIVE_CREATED,
        description: `Archive ${body.entityType} créée: ${body.title}`,
        performedBy: auth.user.sub,
        performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
        metadata: { archiveId: row.id, entityType: body.entityType, entityId: body.entityId },
      })
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /archives', e)
    return apiError(500, 'Internal server error')
  }
}
