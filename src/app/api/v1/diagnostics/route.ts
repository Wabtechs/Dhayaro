import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diagnostics, consultations, patients, users, diseases, episodeEntities, careEpisodes } from '@/lib/schema'
import { eq, ne, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { parseJsonBody, diagnosticCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(diagnostics.description, `%${search}%`),
        ilike(diagnostics.notes, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const consultationId = sanitizeUuid(searchParams.get('consultationId'))
    const diagnosticType = searchParams.get('diagnosticType')
    const isValidated = searchParams.get('isValidated')

    if (patientId) conditions.push(eq(diagnostics.patientId, patientId))
    if (doctorId) conditions.push(eq(diagnostics.doctorId, doctorId))
    if (consultationId) conditions.push(eq(diagnostics.consultationId, consultationId))
    if (diagnosticType) conditions.push(eq(diagnostics.diagnosticType, diagnosticType as 'PROVISIONAL' | 'FINAL' | 'DIFFERENTIAL'))
    if (isValidated !== null && isValidated !== undefined) {
      conditions.push(eq(diagnostics.isValidated, isValidated === 'true'))
    }

    const facilityFilter = addFacilityFilter(diagnostics.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(diagnostics.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(diagnostics).where(whereClause),
      getDb().select({
        id: diagnostics.id,
        facilityId: diagnostics.facilityId,
        consultationId: diagnostics.consultationId,
        patientId: diagnostics.patientId,
        doctorId: diagnostics.doctorId,
        diseaseId: diagnostics.diseaseId,
        episodeId: diagnostics.episodeId,
        diagnosticType: diagnostics.diagnosticType,
        description: diagnostics.description,
        notes: diagnostics.notes,
        isValidated: diagnostics.isValidated,
        validatedBy: diagnostics.validatedBy,
        validatedAt: diagnostics.validatedAt,
        createdAt: diagnostics.createdAt,
        updatedAt: diagnostics.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
        diseaseCode: diseases.code,
        diseaseName: diseases.name,
      })
      .from(diagnostics)
      .leftJoin(patients, eq(diagnostics.patientId, patients.id))
      .leftJoin(users, eq(diagnostics.doctorId, users.id))
      .leftJoin(diseases, eq(diagnostics.diseaseId, diseases.id))
      .where(whereClause)
      .orderBy(desc(diagnostics.createdAt))
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
    logError('GET /diagnostics', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, diagnosticCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)
    const doctorId = sanitizeUuid(body.doctorId)
    const consultationId = sanitizeUuid(body.consultationId)

    const db = getDb()
    const diseaseId = sanitizeUuid(body.diseaseId)

    const [patientCheck, doctorCheck, consultationCheck] = await Promise.all([
      db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1),
      db.select({ id: consultations.id }).from(consultations).where(eq(consultations.id, consultationId)).limit(1),
    ])

    if (patientCheck.length === 0) return apiError(400, 'Patient not found')
    if (doctorCheck.length === 0) return apiError(400, 'Doctor not found')
    if (consultationCheck.length === 0) return apiError(400, 'Consultation not found')

    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()
    const episodeId = sanitizeUuid(body.episodeId)

    const [row] = await db.insert(diagnostics).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      consultationId,
      patientId,
      doctorId,
      diseaseId,
      diagnosticType: body.diagnosticType,
      description: body.description,
      notes: body.notes || null,
      episodeId: episodeId || null,
      isValidated: false,
      validatedBy: null,
      validatedAt: null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    let targetEpisodeId = episodeId

    if (!targetEpisodeId) {
      const activeEpisodes = await db.select({ id: careEpisodes.id }).from(careEpisodes).where(
        and(
          eq(careEpisodes.patientId, patientId),
          eq(careEpisodes.isArchived, false),
          ne(careEpisodes.status, 'DISCHARGED'),
          ne(careEpisodes.status, 'ARCHIVED'),
        )
      ).limit(1)

      if (activeEpisodes.length > 0) {
        targetEpisodeId = activeEpisodes[0].id
      } else {
        const episodeNumber = 'EP-' + Date.now() + '-' + crypto.randomUUID().slice(0, 6)
        const [newEpisode] = await db.insert(careEpisodes).values({
          facilityId: facilityId || null,
          patientId,
          episodeNumber,
          status: 'CONSULTATION',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        }).returning()
        targetEpisodeId = newEpisode.id
      }
    }

    await db.insert(episodeEntities).values({
      id: crypto.randomUUID(),
      episodeId: targetEpisodeId,
      entityType: 'DIAGNOSIS',
      entityId: row.id,
      createdAt: now,
    })

    if (!episodeId) {
      await db.update(diagnostics).set({ episodeId: targetEpisodeId }).where(eq(diagnostics.id, row.id))
      row.episodeId = targetEpisodeId
    }

    await logAudit(auth.user, 'CREATE', 'diagnostic', row.id, { description: row.description, diagnosticType: row.diagnosticType })

    await logPatientEvent({
      facilityId: row.facilityId,
      patientId: row.patientId,
      episodeId: targetEpisodeId,
      eventType: 'DIAGNOSTIC_CREATED',
      title: EVENT_TITLES.DIAGNOSTIC_CREATED,
      description: `Diagnostic ${body.diagnosticType}: ${body.description}`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { diagnosticId: row.id, diagnosticType: body.diagnosticType, diseaseId: body.diseaseId, consultationId },
    })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /diagnostics', e)
    return apiError(500, 'Internal server error')
  }
}
