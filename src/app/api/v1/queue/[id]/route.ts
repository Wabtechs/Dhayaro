import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { queue, patients, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const QUEUE_KEYS = ['status', 'priority', 'assignedDoctorId', 'queuePosition', 'estimatedWaitMinutes', 'notes', 'startedAt', 'completedAt'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [row] = await getDb()
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
      .where(eq(queue.id, id))
      .limit(1)

    if (!row) {
      return apiError(404, 'Queue entry not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /queue/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    const existing = await getDb().select({ id: queue.id }).from(queue).where(eq(queue.id, id)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Queue entry not found')
    }

    const allowedFields = pickAllowedKeys(body, QUEUE_KEYS)

    if ('assignedDoctorId' in body) {
      allowedFields.assignedDoctorId = body.assignedDoctorId || null
    }

    if (body.status === 'WITH_DOCTOR' && !allowedFields.startedAt) {
      allowedFields.startedAt = new Date()
    }

    if (body.status === 'COMPLETED' && !allowedFields.completedAt) {
      allowedFields.completedAt = new Date()
    }

    const [updated] = await getDb()
      .update(queue)
      .set(allowedFields)
      .where(eq(queue.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /queue/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [updated] = await getDb()
      .update(queue)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(queue.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Queue entry not found')
    }

    return NextResponse.json({ detail: 'Queue entry cancelled' })
  } catch (e) {
    logError('DELETE /queue/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
