import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patientHistory, patients } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiErrorResponse, handleEndpointError, pickAllowedKeys } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, patientHistoryUpdateSchema } from '@/lib/api-schemas'

const ALLOWED_UPDATE_KEYS = ['episodeId', 'eventType', 'title', 'description', 'performedBy', 'performedByName', 'metadata'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const eventId = sanitizeUuid(id)
    if (!eventId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'événement est invalide." })

    const conditions = [eq(patientHistory.id, eventId)]
    const facilityFilter = addFacilityFilter(patientHistory.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [row] = await getDb().select({
      id: patientHistory.id,
      facilityId: patientHistory.facilityId,
      patientId: patientHistory.patientId,
      episodeId: patientHistory.episodeId,
      eventType: patientHistory.eventType,
      title: patientHistory.title,
      description: patientHistory.description,
      performedBy: patientHistory.performedBy,
      performedByName: patientHistory.performedByName,
      metadata: patientHistory.metadata,
      createdAt: patientHistory.createdAt,
      patientFirstname: patients.firstname,
      patientLastname: patients.lastname,
    })
    .from(patientHistory)
    .leftJoin(patients, eq(patientHistory.patientId, patients.id))
    .where(and(...conditions))
    .limit(1)

    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'GET /patient-history/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const eventId = sanitizeUuid(id)
    if (!eventId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'événement est invalide." })

    const parsed = await parseJsonBody(request, patientHistoryUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const conditions = [eq(patientHistory.id, eventId)]
    const facilityFilter = addFacilityFilter(patientHistory.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({ id: patientHistory.id }).from(patientHistory).where(and(...conditions)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)

    const [row] = await db.update(patientHistory).set(fields).where(eq(patientHistory.id, eventId)).returning()
    await logAudit(auth.user, 'UPDATE', 'patient_history', eventId, { title: row.title })

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'PUT /patient-history/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const eventId = sanitizeUuid(id)
    if (!eventId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'événement est invalide." })

    const db = getDb()
    const conditions = [eq(patientHistory.id, eventId)]
    const facilityFilter = addFacilityFilter(patientHistory.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({ id: patientHistory.id, title: patientHistory.title }).from(patientHistory).where(and(...conditions)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await db.delete(patientHistory).where(eq(patientHistory.id, eventId))
    await logAudit(auth.user, 'DELETE', 'patient_history', eventId, { title: existing.title })

    return NextResponse.json({ success: true, data: { id: eventId }, message: 'Événement supprimé avec succès.' })
  } catch (e) {
    return handleEndpointError(e, 'DELETE /patient-history/[id]')
  }
}
