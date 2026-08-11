import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments, patients, users, episodeEntities, careEpisodes } from '@/lib/schema'
import { eq, ne, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, enforceFacilityAccess, apiErrorResponse, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { createClinicalDocument, documentExistsForEntity } from '@/lib/documents'
import { parseJsonBody, treatmentCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(treatments.description, `%${search}%`),
        ilike(treatments.notes, `%${search}%`),
        ilike(treatments.outcome, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const consultationId = sanitizeUuid(searchParams.get('consultationId'))
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(treatments.patientId, patientId))
    if (doctorId) conditions.push(eq(treatments.doctorId, doctorId))
    if (consultationId) conditions.push(eq(treatments.consultationId, consultationId))
    if (status) conditions.push(eq(treatments.status, status as 'PRESCRIBED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED'))

    const facilityFilter = addFacilityFilter(treatments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(treatments.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(treatments).where(whereClause),
      getDb().select({
        id: treatments.id,
        facilityId: treatments.facilityId,
        consultationId: treatments.consultationId,
        patientId: treatments.patientId,
        doctorId: treatments.doctorId,
        diagnosisId: treatments.diagnosisId,
        description: treatments.description,
        status: treatments.status,
        startDate: treatments.startDate,
        endDate: treatments.endDate,
        notes: treatments.notes,
        outcome: treatments.outcome,
        episodeId: treatments.episodeId,
        createdAt: treatments.createdAt,
        updatedAt: treatments.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(treatments)
      .leftJoin(patients, eq(treatments.patientId, patients.id))
      .leftJoin(users, eq(treatments.doctorId, users.id))
      .where(whereClause)
      .orderBy(desc(treatments.createdAt))
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
return handleEndpointError(e, 'GET /treatments')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, treatmentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)
    const doctorId = sanitizeUuid(body.doctorId)

    const db = getDb()

    const [patientCheck, doctorCheck] = await Promise.all([
      db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1),
    ])

    if (patientCheck.length === 0) return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: 'Patient introuvable.' })
    if (doctorCheck.length === 0) return apiErrorResponse('VALIDATION_ERROR', 422, { doctorId: 'Médecin introuvable.' })

    const { facilityId } = enforceFacilityAccess(body, auth)
    const consultationId = sanitizeUuid(body.consultationId)
    const diagnosisId = sanitizeUuid(body.diagnosisId)
    const episodeId = sanitizeUuid(body.episodeId)
    const now = new Date()

    const [row] = await db.insert(treatments).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      consultationId: consultationId || null,
      patientId,
      doctorId,
      diagnosisId: diagnosisId || null,
      description: body.description,
      status: body.status || 'PRESCRIBED',
      startDate: body.startDate,
      endDate: body.endDate || null,
      notes: body.notes || null,
      outcome: body.outcome || null,
      episodeId: episodeId || null,
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
          status: 'TREATMENT',
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
      entityType: 'TREATMENT',
      entityId: row.id,
      createdAt: now,
    })

    if (!episodeId) {
      await db.update(treatments).set({ episodeId: targetEpisodeId }).where(eq(treatments.id, row.id))
      row.episodeId = targetEpisodeId
    }

    await logAudit(auth.user, 'CREATE', 'treatment', row.id, { description: row.description, status: row.status })

    await logPatientEvent({
      facilityId: row.facilityId,
      patientId: row.patientId,
      episodeId: targetEpisodeId,
      eventType: 'TREATMENT_PRESCRIBED',
      title: EVENT_TITLES.TREATMENT_PRESCRIBED,
      description: `Traitement prescrit: ${body.description}`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { treatmentId: row.id, status: row.status, diagnosisId: body.diagnosisId, consultationId },
    })

    if (row.status === 'PRESCRIBED') {
      const prescriptionExists = await documentExistsForEntity('episodeId', targetEpisodeId, 'PRESCRIPTION')
      if (!prescriptionExists) {
        await createClinicalDocument({
          facilityId: row.facilityId,
          patientId: row.patientId,
          doctorId: row.doctorId,
          episodeId: targetEpisodeId,
          consultationId: row.consultationId,
          documentType: 'PRESCRIPTION',
          title: 'Prescription de traitement',
                    content: {
            treatmentId: row.id,
            description: row.description,
            notes: row.notes,
            outcome: row.outcome,
            startDate: row.startDate,
            endDate: row.endDate,
            status: row.status,
          },        })
      }

      const pharmUsers = await getDb()
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'PHARMACIST'), eq(users.isActive, true)))

      for (const pharmUser of pharmUsers) {
        await sendNotification({
          userId: pharmUser.id,
          facilityId: row.facilityId,
          title: 'Nouveau traitement prescrit',
          message: `Traitement "${row.description}" prescrit et nécessite une dispensation.`,
          type: 'INFO',
          link: `/treatments/${row.id}`,
          metadata: { treatmentId: row.id, patientId, description: row.description },
        })
      }
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /treatments')
  }
}
