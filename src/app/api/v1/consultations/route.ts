import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { consultations, patients, users, episodeEntities, careEpisodes } from '@/lib/schema'
import { eq, ne, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { parseJsonBody, consultationCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(consultations.consultationNumber, `%${search}%`),
        ilike(consultations.motif, `%${search}%`),
        ilike(consultations.notes, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(consultations.patientId, patientId))
    if (doctorId) conditions.push(eq(consultations.doctorId, doctorId))
    if (status) conditions.push(eq(consultations.status, status as 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'))

    const facilityFilter = addFacilityFilter(consultations.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(consultations.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(consultations).where(whereClause),
      getDb().select({
        id: consultations.id,
        facilityId: consultations.facilityId,
        patientId: consultations.patientId,
        doctorId: consultations.doctorId,
        consultationNumber: consultations.consultationNumber,
        motif: consultations.motif,
        symptoms: consultations.symptoms,
        vitalSigns: consultations.vitalSigns,
        notes: consultations.notes,
        provisionalDiagnosis: consultations.provisionalDiagnosis,
        episodeId: consultations.episodeId,
        status: consultations.status,
        isFollowUp: consultations.isFollowUp,
        previousConsultationId: consultations.previousConsultationId,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(consultations)
      .leftJoin(patients, eq(consultations.patientId, patients.id))
      .leftJoin(users, eq(consultations.doctorId, users.id))
      .where(whereClause)
      .orderBy(desc(consultations.createdAt))
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
    logError('GET /consultations', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, consultationCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)
    const doctorId = sanitizeUuid(body.doctorId)

    const db = getDb()

    const [patientCheck, doctorCheck] = await Promise.all([
      db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1),
    ])

    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }
    if (doctorCheck.length === 0) {
      return apiError(400, 'Doctor not found')
    }

    const consultationNumber = 'CONS-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()
    const episodeId = sanitizeUuid(body.episodeId)

    const [row] = await db.insert(consultations).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      patientId,
      doctorId,
      consultationNumber,
      motif: body.motif,
      symptoms: body.symptoms || [],
      vitalSigns: body.vitalSigns || {},
      notes: body.notes || null,
      provisionalDiagnosis: body.provisionalDiagnosis || null,
      status: body.status || 'WAITING',
      episodeId: episodeId || null,
      isFollowUp: body.isFollowUp ?? false,
      previousConsultationId: sanitizeUuid(body.previousConsultationId) || null,
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
      entityType: 'CONSULTATION',
      entityId: row.id,
      createdAt: now,
    })

    if (!episodeId) {
      await db.update(consultations).set({ episodeId: targetEpisodeId }).where(eq(consultations.id, row.id))
      row.episodeId = targetEpisodeId
    }

    await logAudit(auth.user, 'CREATE', 'consultation', row.id, { consultationNumber: row.consultationNumber, patientId: row.patientId, motif: row.motif })

    await sendNotification({
      userId: doctorId,
      facilityId: row.facilityId,
      title: 'Nouvelle consultation',
      message: `Consultation #${consultationNumber} assignée. Motif: ${body.motif}`,
      type: 'INFO',
      link: `/consultations/${row.id}`,
      metadata: { consultationId: row.id, patientId, consultationNumber },
    })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /consultations', e)
    return apiError(500, 'Internal server error')
  }
}
