import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { queue, patients, users, careEpisodes } from '@/lib/schema'
import { eq, desc, and, or, ilike, count, sql, max } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, addDoctorFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const status = searchParams.get('status')

    const conditions = []

    if (search) {
      conditions.push(or(
        ilike(queue.ticketNumber, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    if (status) {
      conditions.push(eq(queue.status, status as 'WAITING' | 'WITH_DOCTOR' | 'WITH_LAB' | 'WITH_PHARMACY' | 'COMPLETED' | 'CANCELLED'))
    }

    const facilityFilter = addFacilityFilter(queue.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const doctorFilter = addDoctorFilter(queue.assignedDoctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(queue).where(whereClause),
      getDb()
        .select({
          id: queue.id,
          facilityId: queue.facilityId,
          patientId: queue.patientId,
          consultationId: queue.consultationId,
          ticketNumber: queue.ticketNumber,
          priority: queue.priority,
          status: queue.status,
          assignedDoctorId: queue.assignedDoctorId,
          queuePosition: queue.queuePosition,
          estimatedWaitMinutes: queue.estimatedWaitMinutes,
          arrivedAt: queue.arrivedAt,
          startedAt: queue.startedAt,
          completedAt: queue.completedAt,
          notes: queue.notes,
          createdAt: queue.createdAt,
          updatedAt: queue.updatedAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
          patientPhone: patients.phone,
          doctorFirstname: users.firstname,
          doctorLastname: users.lastname,
        })
        .from(queue)
        .leftJoin(patients, eq(queue.patientId, patients.id))
        .leftJoin(users, eq(queue.assignedDoctorId, users.id))
        .where(whereClause)
        .orderBy(desc(queue.createdAt))
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
    logError('GET /queue', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.patientId) {
      return apiError(400, 'patientId is required')
    }

    const patientId = sanitizeUuid(body.patientId)
    if (!patientId) {
      return apiError(400, 'Invalid patientId')
    }

    const patientCheck = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }

    const now = new Date()
    const ticketNumber = `Q-${now.getTime()}`

    const [maxPosResult] = await getDb()
      .select({ maxPos: sql<number>`coalesce(max(${queue.queuePosition}), 0)` })
      .from(queue)
      .where(and(
        eq(queue.facilityId, auth.user.facilityId || ''),
        eq(queue.status, 'WAITING'),
      ))

    const nextPosition = (maxPosResult?.maxPos ?? 0) + 1

    const [row] = await getDb().insert(queue).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      patientId,
      consultationId: sanitizeUuid(body.consultationId) || null,
      ticketNumber,
      priority: body.priority || 'NORMAL',
      status: 'WAITING',
      assignedDoctorId: sanitizeUuid(body.assignedDoctorId) || null,
      queuePosition: nextPosition,
      estimatedWaitMinutes: body.estimatedWaitMinutes || null,
      arrivedAt: now,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'queue', row.id, { patientId: row.patientId, ticketNumber: row.ticketNumber })

    // Cascade: auto-create care_episode if patient has no active episode
    const [activeEpisode] = await getDb()
      .select({ id: careEpisodes.id })
      .from(careEpisodes)
      .where(and(
        eq(careEpisodes.patientId, patientId),
        eq(careEpisodes.isArchived, false),
        sql`${careEpisodes.status} NOT IN ('DISCHARGED', 'ARCHIVED')`,
      ))
      .limit(1)

    if (!activeEpisode) {
      const now2 = new Date()
      const year = now2.getFullYear()
      const yearPrefix = `EP-${year}-`
      const [{ value: maxNum }] = await getDb().select({
        value: sql<number>`coalesce(max(cast(right(${careEpisodes.episodeNumber}, 6) as integer)), 0)`
      }).from(careEpisodes).where(ilike(careEpisodes.episodeNumber, `${yearPrefix}%`))
      const episodeNumber = `EP-${year}-${String((maxNum ?? 0) + 1).padStart(6, '0')}`

      await getDb().insert(careEpisodes).values({
        id: crypto.randomUUID(),
        facilityId: row.facilityId,
        patientId,
        episodeNumber,
        status: 'TRIAGE',
        admitDate: now2,
        admitReason: 'File d\'attente - admission automatique',
        isArchived: false,
        metadata: {},
        createdAt: now2,
        updatedAt: now2,
      })
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /queue', e)
    return apiError(500, 'Internal server error')
  }
}
