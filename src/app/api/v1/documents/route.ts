import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { documents, patients, episodeEntities } from '@/lib/schema'
import { eq, desc, and, or, ilike, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { parseJsonBody, documentCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const documentType = searchParams.get('documentType')

    const conditions = []

    if (search) {
      conditions.push(or(
        ilike(documents.title, `%${search}%`),
        ilike(documents.documentType, `%${search}%`),
      )!)
    }

    if (patientId) {
      conditions.push(eq(documents.patientId, patientId))
    }
    if (documentType) {
      conditions.push(eq(documents.documentType, documentType as 'PRESCRIPTION' | 'CERTIFICATE' | 'REPORT' | 'LAB_RESULT' | 'REFERRAL' | 'ORDONNANCE'))
    }

    const facilityFilter = addFacilityFilter(documents.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(documents.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(documents).where(whereClause),
      getDb()
        .select({
          id: documents.id,
          facilityId: documents.facilityId,
          patientId: documents.patientId,
          consultationId: documents.consultationId,
          doctorId: documents.doctorId,
          documentType: documents.documentType,
          title: documents.title,
          content: documents.content,
          filePath: documents.filePath,
          isPrinted: documents.isPrinted,
          createdAt: documents.createdAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
        })
        .from(documents)
        .leftJoin(patients, eq(documents.patientId, patients.id))
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
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
return handleEndpointError(e, 'GET /documents')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'ARCHIVIST', 'RECEPTIONIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, documentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const episodeId = sanitizeUuid(body.episodeId)
    const db = getDb()

    const [row] = await db.insert(documents).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      patientId: sanitizeUuid(body.patientId) || null,
      consultationId: sanitizeUuid(body.consultationId) || null,
      doctorId: sanitizeUuid(body.doctorId) || auth.user.sub,
      episodeId: episodeId || null,
      documentType: body.documentType,
      title: body.title,
      content: body.content || {},
      filePath: body.filePath || null,
      isPrinted: false,
      createdAt: now,
    }).returning()

    if (episodeId) {
      await db.insert(episodeEntities).values({
        id: crypto.randomUUID(),
        episodeId,
        entityType: 'DOCUMENT',
        entityId: row.id,
        createdAt: now,
      })
    }

    await logAudit(auth.user, 'CREATE', 'document', row.id, { title: row.title, documentType: row.documentType })

    if (row.patientId) {
      await logPatientEvent({
        facilityId: row.facilityId,
        patientId: row.patientId,
        episodeId: row.episodeId,
        eventType: 'DOCUMENT_CREATED',
        title: EVENT_TITLES.DOCUMENT_CREATED,
        description: `Document ${body.documentType} créé: ${body.title}`,
        performedBy: auth.user.sub,
        performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
        metadata: { documentId: row.id, documentType: body.documentType, consultationId: body.consultationId },
      })
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /documents')
  }
}
