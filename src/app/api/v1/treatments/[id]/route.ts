import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
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
return handleEndpointError(e, 'GET /treatments/[id]')
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

    if (allowedFields.status) {
      const statusEventMap: Record<string, 'TREATMENT_STARTED' | 'TREATMENT_COMPLETED' | 'TREATMENT_CANCELLED' | 'TREATMENT_SUSPENDED'> = {
        IN_PROGRESS: 'TREATMENT_STARTED',
        COMPLETED: 'TREATMENT_COMPLETED',
        CANCELLED: 'TREATMENT_CANCELLED',
        SUSPENDED: 'TREATMENT_SUSPENDED',
      }
      const eventType = statusEventMap[allowedFields.status as string]
      if (eventType) {
        await logPatientEvent({
          facilityId: updated.facilityId,
          patientId: updated.patientId,
          episodeId: updated.episodeId,
          eventType,
          title: EVENT_TITLES[eventType],
          description: `Traitement "${updated.description}" - Nouveau statut: ${allowedFields.status}`,
          performedBy: auth.user.sub,
          performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
          metadata: { treatmentId: updated.id, previousStatus: updated.status, newStatus: allowedFields.status },
        })
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /treatments/[id]')
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

    await logPatientEvent({
      facilityId: deleted.facilityId,
      patientId: deleted.patientId,
      episodeId: deleted.episodeId,
      eventType: 'TREATMENT_CANCELLED',
      title: EVENT_TITLES.TREATMENT_CANCELLED,
      description: `Traitement "${deleted.description}" annulé`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { treatmentId: deleted.id },
    })

    return NextResponse.json({ detail: 'Treatment cancelled' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /treatments/[id]')
  }
}
