import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { queue, patients, users } from '@/lib/schema'
import { eq, desc, and, count, sql } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const status = searchParams.get('status')

    const conditions = []

    if (status) {
      conditions.push(eq(queue.status, status as 'WAITING' | 'WITH_DOCTOR' | 'WITH_LAB' | 'WITH_PHARMACY' | 'COMPLETED' | 'CANCELLED'))
    }

    if (auth.user.facilityId && ['DOCTOR', 'SPECIALIST', 'NURSE', 'RECEPTIONIST'].includes(auth.user.role)) {
      conditions.push(eq(queue.facilityId, auth.user.facilityId))
    }

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
    const auth = await requireAuth(request)
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
      facilityId: auth.user.facilityId || null,
      patientId,
      consultationId: sanitizeUuid(body.consultationId) || null,
      ticketNumber,
      priority: body.priority || 'NORMAL',
      status: 'WAITING',
      assignedDoctorId: null,
      queuePosition: nextPosition,
      estimatedWaitMinutes: body.estimatedWaitMinutes || null,
      arrivedAt: now,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /queue', e)
    return apiError(500, 'Internal server error')
  }
}
