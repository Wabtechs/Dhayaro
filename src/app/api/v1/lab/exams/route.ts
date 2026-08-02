import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams, patients, users, labCategories, episodeEntities, queue, careEpisodes } from '@/lib/schema'
import { eq, ne, desc, and, or, ilike, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { parseJsonBody, labExamCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const categoryId = sanitizeUuid(searchParams.get('categoryId'))
    const status = searchParams.get('status')

    const conditions = []

    if (search) {
      conditions.push(or(
        ilike(labExams.examName, `%${search}%`),
        ilike(labExams.clinicalIndication, `%${search}%`),
        ilike(labExams.resultNotes, `%${search}%`),
      )!)
    }

    if (patientId) {
      conditions.push(eq(labExams.patientId, patientId))
    }
    if (categoryId) {
      conditions.push(eq(labExams.categoryId, categoryId))
    }
    if (status) {
      conditions.push(eq(labExams.status, status as 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'))
    }

    const facilityFilter = addFacilityFilter(labExams.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(labExams.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(labExams).where(whereClause),
      getDb()
        .select({
          id: labExams.id,
          facilityId: labExams.facilityId,
          patientId: labExams.patientId,
          doctorId: labExams.doctorId,
          labTechnicianId: labExams.labTechnicianId,
          categoryId: labExams.categoryId,
          consultationId: labExams.consultationId,
          episodeId: labExams.episodeId,
          examName: labExams.examName,
          clinicalIndication: labExams.clinicalIndication,
          status: labExams.status,
          results: labExams.results,
          resultNotes: labExams.resultNotes,
          validatedBy: labExams.validatedBy,
          validatedAt: labExams.validatedAt,
          requestedAt: labExams.requestedAt,
          completedAt: labExams.completedAt,
          createdAt: labExams.createdAt,
          updatedAt: labExams.updatedAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
          doctorFirstname: users.firstname,
          doctorLastname: users.lastname,
          categoryName: labCategories.name,
        })
        .from(labExams)
        .leftJoin(patients, eq(labExams.patientId, patients.id))
        .leftJoin(users, eq(labExams.doctorId, users.id))
        .leftJoin(labCategories, eq(labExams.categoryId, labCategories.id))
        .where(whereClause)
        .orderBy(desc(labExams.createdAt))
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
    logError('GET /lab/exams', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'LABORATORY'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, labExamCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)

    const patientCheck = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }

    if (body.categoryId) {
      const catId = sanitizeUuid(body.categoryId)
      if (!catId) {
        return apiError(400, 'Invalid categoryId')
      }
      const catCheck = await getDb().select({ id: labCategories.id }).from(labCategories).where(eq(labCategories.id, catId)).limit(1)
      if (catCheck.length === 0) {
        return apiError(400, 'Lab category not found')
      }
    }

    const doctorId = sanitizeUuid(body.doctorId) || auth.user.sub

    const now = new Date()
    const episodeId = sanitizeUuid(body.episodeId)
    const db = getDb()

    const [row] = await db.insert(labExams).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      patientId,
      doctorId,
      labTechnicianId: sanitizeUuid(body.labTechnicianId) || null,
      categoryId: sanitizeUuid(body.categoryId) || null,
      consultationId: sanitizeUuid(body.consultationId) || null,
      episodeId: episodeId || null,
      examName: body.examName,
      clinicalIndication: body.clinicalIndication || null,
      status: 'REQUESTED',
      results: body.results || {},
      resultNotes: body.resultNotes || null,
      requestedAt: now,
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
          facilityId: enforceFacilityAccess(body, auth).facilityId,
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
      entityType: 'LAB_EXAM',
      entityId: row.id,
      createdAt: now,
    })

    if (!episodeId) {
      await db.update(labExams).set({ episodeId: targetEpisodeId }).where(eq(labExams.id, row.id))
      row.episodeId = targetEpisodeId
    }

    await logAudit(auth.user, 'CREATE', 'lab_exam', row.id, { examName: row.examName })

    // Notify LABORATORY users
    const labUsers = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.role, 'LABORATORY'),
        eq(users.isActive, true),
      ))

    for (const labUser of labUsers) {
      await sendNotification({
        userId: labUser.id,
        facilityId: row.facilityId,
        title: 'Nouvel examen de laboratoire',
        message: `Examen "${row.examName}" demandé pour le patient.`,
        type: 'INFO',
        link: `/laboratory/${row.id}`,
        metadata: { labExamId: row.id, patientId, examName: row.examName },
      })
    }

    // Cascade: update queue status to WITH_LAB
    const [queueTicket] = await getDb()
      .select({ id: queue.id })
      .from(queue)
      .where(and(eq(queue.patientId, patientId), eq(queue.status, 'WITH_DOCTOR')))
      .limit(1)

    if (queueTicket) {
      await getDb()
        .update(queue)
        .set({ status: 'WITH_LAB', updatedAt: new Date() })
        .where(eq(queue.id, queueTicket.id))
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /lab/exams', e)
    return apiError(500, 'Internal server error')
  }
}
