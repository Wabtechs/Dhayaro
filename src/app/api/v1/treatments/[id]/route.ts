import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, treatmentUpdateSchema } from '@/lib/api-schemas'

const TREATMENT_KEYS = ['description', 'status', 'startDate', 'endDate', 'notes', 'outcome', 'consultationId', 'patientId', 'doctorId', 'diagnosisId', 'facilityId'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb().select().from(treatments).where(eq(treatments.id, validId)).limit(1)

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
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const parsed = await parseJsonBody(request, treatmentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const allowedFields = pickAllowedKeys(body, TREATMENT_KEYS)

    const [updated] = await getDb()
      .update(treatments)
      .set(allowedFields)
      .where(eq(treatments.id, validId))
      .returning()

    if (!updated) {
      return apiError(404, 'Treatment not found')
    }

    await logAudit(auth.user, 'UPDATE', 'treatment', validId, { ...allowedFields })

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
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [deleted] = await getDb()
      .update(treatments)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(treatments.id, validId))
      .returning()

    if (!deleted) {
      return apiError(404, 'Treatment not found')
    }

    await logAudit(auth.user, 'DELETE', 'treatment', validId, { description: deleted.description })

    return NextResponse.json({ detail: 'Treatment cancelled' })
  } catch (e) {
    logError('DELETE /treatments/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
