import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const TREATMENT_KEYS = ['description', 'status', 'startDate', 'endDate', 'notes', 'outcome', 'consultationId', 'patientId', 'doctorId', 'diagnosisId', 'facilityId'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(treatments).where(eq(treatments.id, id)).limit(1)

    if (!row) {
      return apiError(404, 'Treatment not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /treatments/[id]', e)
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

    if (body.patientId) {
      const patientId = sanitizeUuid(body.patientId)
      if (!patientId) return apiError(400, 'Invalid patientId')
    }
    if (body.doctorId) {
      const doctorId = sanitizeUuid(body.doctorId)
      if (!doctorId) return apiError(400, 'Invalid doctorId')
    }

    const allowedFields = pickAllowedKeys(body, TREATMENT_KEYS)

    const [updated] = await getDb()
      .update(treatments)
      .set(allowedFields)
      .where(eq(treatments.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Treatment not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /treatments/[id]', e)
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

    const [deleted] = await getDb()
      .update(treatments)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(treatments.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'Treatment not found')
    }

    return NextResponse.json({ detail: 'Treatment cancelled' })
  } catch (e) {
    logError('DELETE /treatments/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
