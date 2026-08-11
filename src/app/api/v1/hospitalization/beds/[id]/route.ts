import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { beds, bedAssignments, patients, careEpisodes } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError, enforceFacilityAccess, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, bedUpdateSchema } from '@/lib/api-schemas'
import { sanitizeUuid } from '@/lib/validation'

const ALLOWED_BED_UPDATE = [
  'bedNumber', 'floor', 'room', 'department', 'label', 'type', 'notes', 'status', 'isActive',
] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: "L'identifiant du lit est invalide." })

    const row = await getDb()
      .select({
        id: beds.id,
        facilityId: beds.facilityId,
        locationId: beds.locationId,
        bedNumber: beds.bedNumber,
        floor: beds.floor,
        room: beds.room,
        department: beds.department,
        label: beds.label,
        type: beds.type,
        status: beds.status,
        notes: beds.notes,
        isActive: beds.isActive,
        createdAt: beds.createdAt,
        updatedAt: beds.updatedAt,
        assignmentId: bedAssignments.id,
        patientId: bedAssignments.patientId,
        episodeId: bedAssignments.episodeId,
        assignedAt: bedAssignments.assignedAt,
        releasedAt: bedAssignments.releasedAt,
        notesAssignment: bedAssignments.notes,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        episodeNumber: careEpisodes.episodeNumber,
      })
      .from(beds)
      .leftJoin(
        bedAssignments,
        and(
          eq(bedAssignments.bedId, beds.id),
          eq(bedAssignments.status, 'ACTIVE'),
          eq(bedAssignments.isActive, true),
        ),
      )
      .leftJoin(patients, eq(bedAssignments.patientId, patients.id))
      .leftJoin(careEpisodes, eq(bedAssignments.episodeId, careEpisodes.id))
      .where(eq(beds.id, validId))
      .limit(1)

    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const facilityId = row.facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && facilityId !== auth.user.facilityId) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'GET /hospitalization/beds/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: "L'identifiant du lit est invalide." })

    const [existing] = await getDb()
      .select({ id: beds.id, facilityId: beds.facilityId })
      .from(beds)
      .where(eq(beds.id, validId))
      .limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const facilityId = enforceFacilityAccess(existing, auth).facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && existing.facilityId !== facilityId) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const parsed = await parseJsonBody(request, bedUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const updates = pickAllowedKeys(body, ALLOWED_BED_UPDATE)

    const oldStatusRow = await getDb().select({ status: beds.status }).from(beds).where(eq(beds.id, validId)).limit(1)
    const oldStatus = oldStatusRow[0]?.status

    await getDb().update(beds).set(updates).where(eq(beds.id, validId))

    if (updates.status && updates.status !== oldStatus) {
      await logAudit(auth.user, 'UPDATE', 'bed', validId, { status: updates.status, previousStatus: oldStatus })
    } else {
      await logAudit(auth.user, 'UPDATE', 'bed', validId)
    }

    return NextResponse.json({ success: true, id: validId })
  } catch (e) {
    return handleEndpointError(e, 'PUT /hospitalization/beds/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: "L'identifiant du lit est invalide." })

    const db = getDb()
    const [existing] = await db
      .select({ id: beds.id, facilityId: beds.facilityId, status: beds.status })
      .from(beds)
      .where(eq(beds.id, validId))
      .limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const facilityId = enforceFacilityAccess(existing, auth).facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && existing.facilityId !== facilityId) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    await db.transaction(async (tx) => {
      await tx.update(beds)
        .set({ isActive: false, status: 'OUT_OF_SERVICE', updatedAt: new Date() })
        .where(eq(beds.id, validId))

      await tx
        .update(bedAssignments)
        .set({ status: 'CANCELLED', isActive: false, releasedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(bedAssignments.bedId, validId), eq(bedAssignments.status, 'ACTIVE'), eq(bedAssignments.isActive, true)))
    })

    await logAudit(auth.user, 'DELETE', 'bed', validId, { facilityId })

    return NextResponse.json({ success: true, id: validId })
  } catch (e) {
    return handleEndpointError(e, 'DELETE /hospitalization/beds/[id]')
  }
}
