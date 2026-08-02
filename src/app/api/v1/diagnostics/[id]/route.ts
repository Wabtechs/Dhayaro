import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diagnostics, patients, users, diseases } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { parseJsonBody, diagnosticUpdateSchema } from '@/lib/api-schemas'

const DIAGNOSTIC_KEYS = ['diseaseId', 'diagnosticType', 'description', 'notes', 'consultationId', 'patientId', 'doctorId', 'facilityId', 'isValidated'] as const

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

    const [row] = await getDb().select({
      id: diagnostics.id,
      facilityId: diagnostics.facilityId,
      consultationId: diagnostics.consultationId,
      patientId: diagnostics.patientId,
      doctorId: diagnostics.doctorId,
      diseaseId: diagnostics.diseaseId,
      episodeId: diagnostics.episodeId,
      diagnosticType: diagnostics.diagnosticType,
      description: diagnostics.description,
      notes: diagnostics.notes,
      isValidated: diagnostics.isValidated,
      validatedBy: diagnostics.validatedBy,
      validatedAt: diagnostics.validatedAt,
      createdAt: diagnostics.createdAt,
      updatedAt: diagnostics.updatedAt,
      patientFirstname: patients.firstname,
      patientLastname: patients.lastname,
      doctorFirstname: users.firstname,
      doctorLastname: users.lastname,
      diseaseCode: diseases.code,
      diseaseName: diseases.name,
    })
    .from(diagnostics)
    .leftJoin(patients, eq(diagnostics.patientId, patients.id))
    .leftJoin(users, eq(diagnostics.doctorId, users.id))
    .leftJoin(diseases, eq(diagnostics.diseaseId, diseases.id))
    .where(eq(diagnostics.id, validId))
    .limit(1)

    if (!row) {
      return apiError(404, 'Diagnostic not found')
    }

    return NextResponse.json(row)
  } catch {
    return apiError(500, 'Internal server error')
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
    if (!validId) return apiError(400, 'ID invalide')

    const parsed = await parseJsonBody(request, diagnosticUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({
      id: diagnostics.id,
      doctorId: diagnostics.doctorId,
      patientId: diagnostics.patientId,
      isValidated: diagnostics.isValidated,
    }).from(diagnostics).where(eq(diagnostics.id, validId)).limit(1)
    if (existing.length === 0) return apiError(404, 'Diagnostic not found')

    const allowedFields = pickAllowedKeys(body, DIAGNOSTIC_KEYS)

    if (body.isValidated === true && !body.validatedBy) {
      allowedFields.validatedBy = auth.user.sub
      allowedFields.validatedAt = new Date()
    }

    const [updated] = await getDb()
      .update(diagnostics)
      .set(allowedFields)
      .where(eq(diagnostics.id, validId))
      .returning()

    if (!updated) {
      return apiError(404, 'Diagnostic not found')
    }

    await logAudit(auth.user, 'UPDATE', 'diagnostic', validId, { ...allowedFields })

    if (body.isValidated === true && !existing[0].isValidated) {
      await sendNotification({
        userId: existing[0].doctorId,
        facilityId: updated.facilityId,
        title: 'Diagnostic validé',
        message: 'Un diagnostic a été validé.',
        type: 'SUCCESS',
        link: `/diagnostics/${validId}`,
        metadata: { diagnosticId: validId, patientId: existing[0].patientId },
      })
    }

    return NextResponse.json(updated)
  } catch {
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

    const existing = await getDb().select({ id: diagnostics.id }).from(diagnostics).where(eq(diagnostics.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Diagnostic not found')
    }

    await getDb().update(diagnostics).set({ isActive: false, updatedAt: new Date() }).where(eq(diagnostics.id, validId))

    await logAudit(auth.user, 'DELETE', 'diagnostic', validId)

    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /diagnostics/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
