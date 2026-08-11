import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiErrorResponse, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, clinicalCaseUpdateSchema } from '@/lib/api-schemas'

const CLINICAL_CASE_KEYS = ['title', 'description', 'patientId', 'doctorId', 'facilityId', 'symptomsJson', 'provisionalDiagnosis', 'treatment', 'treatmentDuration', 'outcomeStatus', 'outcomeNotes', 'priority', 'tagsJson'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { caseId: "L'identifiant du dossier est invalide." })

    const [row] = await getDb().select().from(clinicalCases).where(eq(clinicalCases.id, validId)).limit(1)

    if (!row) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /clinical-cases/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { caseId: "L'identifiant du dossier est invalide." })

    const parsed = await parseJsonBody(request, clinicalCaseUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const allowedFields = pickAllowedKeys(body, CLINICAL_CASE_KEYS)

    const db = getDb()

    if (allowedFields.patientId) {
      const pid = sanitizeUuid(allowedFields.patientId as string)
      if (!pid) return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: "L'identifiant du patient est invalide." })
      const check = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, pid)).limit(1)
      if (check.length === 0) return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: 'Patient introuvable.' })
      allowedFields.patientId = pid
    }

    if (allowedFields.doctorId) {
      const did = sanitizeUuid(allowedFields.doctorId as string)
      if (!did) return apiErrorResponse('VALIDATION_ERROR', 422, { doctorId: "L'identifiant du médecin est invalide." })
      const check = await db.select({ id: users.id }).from(users).where(eq(users.id, did)).limit(1)
      if (check.length === 0) return apiErrorResponse('VALIDATION_ERROR', 422, { doctorId: 'Médecin introuvable.' })
      allowedFields.doctorId = did
    }

    if (allowedFields.facilityId) {
      const fid = sanitizeUuid(allowedFields.facilityId as string)
      if (!fid) return apiErrorResponse('VALIDATION_ERROR', 422, { facilityId: "L'identifiant de l'établissement est invalide." })
      const check = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, fid)).limit(1)
      if (check.length === 0) return apiErrorResponse('VALIDATION_ERROR', 422, { facilityId: 'Établissement introuvable.' })
      allowedFields.facilityId = fid
    }

    const [updated] = await db
      .update(clinicalCases)
      .set(allowedFields)
      .where(eq(clinicalCases.id, validId))
      .returning()

    if (!updated) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'UPDATE', 'clinical_case', validId, { title: updated.title })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /clinical-cases/[id]')
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
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { caseId: "L'identifiant du dossier est invalide." })

    const [deleted] = await getDb()
      .delete(clinicalCases)
      .where(eq(clinicalCases.id, validId))
      .returning()

    if (!deleted) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'DELETE', 'clinical_case', validId, { title: deleted.title })

    return NextResponse.json({ success: true, data: { id: validId }, message: 'Dossier clinique supprimé avec succès.' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /clinical-cases/[id]')
  }
}
