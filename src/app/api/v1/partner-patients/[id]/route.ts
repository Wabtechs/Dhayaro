import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { partnerPatients, partnerCompanies, patients } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiErrorResponse, handleEndpointError, pickAllowedKeys } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, partnerPatientUpdateSchema } from '@/lib/api-schemas'

const ALLOWED_UPDATE_KEYS = ['partnerId', 'patientId', 'contractNumber', 'coverageRate', 'annualCeiling', 'remainingAmount', 'validFrom', 'validUntil', 'status', 'notes'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const affiliationId = sanitizeUuid(id)
    if (!affiliationId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'affiliation est invalide." })

    const db = getDb()

    const conditions = [eq(partnerPatients.id, affiliationId)]
    const facilityFilter = addFacilityFilter(partnerPatients.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [row] = await db
      .select({
        id: partnerPatients.id,
        facilityId: partnerPatients.facilityId,
        partnerId: partnerPatients.partnerId,
        patientId: partnerPatients.patientId,
        contractNumber: partnerPatients.contractNumber,
        coverageRate: partnerPatients.coverageRate,
        annualCeiling: partnerPatients.annualCeiling,
        remainingAmount: partnerPatients.remainingAmount,
        validFrom: partnerPatients.validFrom,
        validUntil: partnerPatients.validUntil,
        status: partnerPatients.status,
        notes: partnerPatients.notes,
        isActive: partnerPatients.isActive,
        createdAt: partnerPatients.createdAt,
        updatedAt: partnerPatients.updatedAt,
        partnerName: partnerCompanies.name,
        partnerCode: partnerCompanies.code,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
      })
      .from(partnerPatients)
      .leftJoin(partnerCompanies, eq(partnerPatients.partnerId, partnerCompanies.id))
      .leftJoin(patients, eq(partnerPatients.patientId, patients.id))
      .where(and(...conditions))
      .limit(1)

    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'GET /partner-patients/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const affiliationId = sanitizeUuid(id)
    if (!affiliationId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'affiliation est invalide." })

    const parsed = await parseJsonBody(request, partnerPatientUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()

    const conditions = [eq(partnerPatients.id, affiliationId)]
    const facilityFilter = addFacilityFilter(partnerPatients.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select().from(partnerPatients).where(and(...conditions)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)

    const [row] = await db.update(partnerPatients).set({ ...fields, updatedAt: new Date() }).where(eq(partnerPatients.id, affiliationId)).returning()
    await logAudit(auth.user, 'UPDATE', 'partner_patient', affiliationId, { partnerId: row.partnerId, patientId: row.patientId })

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'PUT /partner-patients/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const affiliationId = sanitizeUuid(id)
    if (!affiliationId) return apiErrorResponse('VALIDATION_ERROR', 422, { id: "L'identifiant de l'affiliation est invalide." })

    const db = getDb()

    const conditions = [eq(partnerPatients.id, affiliationId)]
    const facilityFilter = addFacilityFilter(partnerPatients.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select().from(partnerPatients).where(and(...conditions)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await db.update(partnerPatients).set({ isActive: false, updatedAt: new Date() }).where(eq(partnerPatients.id, affiliationId))
    await logAudit(auth.user, 'DELETE', 'partner_patient', affiliationId, { partnerId: existing.partnerId, patientId: existing.patientId })

    return NextResponse.json({ success: true, data: { id: affiliationId }, message: 'Affiliation supprimée avec succès.' })
  } catch (e) {
    return handleEndpointError(e, 'DELETE /partner-patients/[id]')
  }
}
