import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiErrorResponse, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, patientUpdateSchema } from '@/lib/api-schemas'
import { sanitizeUuid } from '@/lib/validation'

const PATIENT_KEYS = ['firstname', 'lastname', 'email', 'sex', 'dateOfBirth', 'bloodGroup', 'facilityId', 'allergies', 'phone', 'address', 'patientUuid', 'age', 'medicalHistoryJson'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: 'L\'identifiant du patient est invalide.' })

    const [row] = await getDb().select().from(patients).where(eq(patients.id, validId)).limit(1)

    if (!row) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /patients/[id]')
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: 'L\'identifiant du patient est invalide.' })

    const parsed = await parseJsonBody(request, patientUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const allowedFields = pickAllowedKeys(body, PATIENT_KEYS)

    const [updated] = await getDb()
      .update(patients)
      .set(allowedFields)
      .where(eq(patients.id, validId))
      .returning()

    if (!updated) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'UPDATE', 'patient', validId, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /patients/[id]')
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
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: 'L\'identifiant du patient est invalide.' })

    const [deleted] = await getDb()
      .update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, validId))
      .returning()

    if (!deleted) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'DELETE', 'patient', validId, { firstname: deleted.firstname, lastname: deleted.lastname })

    return NextResponse.json({ success: true, data: { id: validId }, message: 'Patient supprimé avec succès.' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /patients/[id]')
  }
}
