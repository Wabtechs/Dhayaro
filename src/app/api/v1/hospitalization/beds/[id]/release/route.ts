import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { beds, bedAssignments, patients } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError, enforceFacilityAccess } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { sanitizeUuid } from '@/lib/validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const bedId = sanitizeUuid(id)
    if (!bedId) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: "L'identifiant du lit est invalide." })

    const db = getDb()
    const now = new Date()

    const [bed] = await db
      .select({ id: beds.id, facilityId: beds.facilityId, bedNumber: beds.bedNumber, room: beds.room, label: beds.label, status: beds.status })
      .from(beds)
      .where(eq(beds.id, bedId))
      .limit(1)

    if (!bed) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const facilityId = enforceFacilityAccess(bed, auth).facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && bed.facilityId !== facilityId) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const [assignment] = await db
      .select({
        id: bedAssignments.id,
        patientId: bedAssignments.patientId,
        episodeId: bedAssignments.episodeId,
        notes: bedAssignments.notes,
      })
      .from(bedAssignments)
      .where(and(eq(bedAssignments.bedId, bedId), eq(bedAssignments.status, 'ACTIVE'), eq(bedAssignments.isActive, true)))
      .limit(1)

    if (!assignment) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: "Ce lit n'est pas actuellement occupé." })

    const [patient] = await db
      .select({ firstname: patients.firstname, lastname: patients.lastname })
      .from(patients)
      .where(eq(patients.id, assignment.patientId))
      .limit(1)

    await db.transaction(async (tx) => {
      await tx
        .update(bedAssignments)
        .set({ status: 'COMPLETED', isActive: true, releasedAt: now, updatedAt: now })
        .where(eq(bedAssignments.id, assignment.id))

      await tx
        .update(beds)
        .set({ status: 'CLEANING', updatedAt: now })
        .where(eq(beds.id, bedId))
    })

    const patientName = patient ? `${patient.firstname || ''} ${patient.lastname || ''}`.trim() : ''

    await logAudit(auth.user, 'UPDATE', 'bed_assignment', assignment.id, {
      bedId,
      bedNumber: bed.bedNumber,
      status: 'COMPLETED',
      releasedAt: now.toISOString(),
    })

    await logPatientEvent({
      facilityId: bed.facilityId,
      patientId: assignment.patientId,
      episodeId: assignment.episodeId || undefined,
      eventType: 'HOSPITALIZATION_DISCHARGED',
      title: EVENT_TITLES.HOSPITALIZATION_DISCHARGED,
      description: `Sortie du lit ${bed.bedNumber || bed.room} (${bed.label || '—'})`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
      metadata: {
        bedId,
        bedNumber: bed.bedNumber,
        room: bed.room,
        episodeId: assignment.episodeId || null,
        assignmentId: assignment.id,
      },
    })

    return NextResponse.json({
      assignmentId: assignment.id,
      bedId,
      bedNumber: bed.bedNumber,
      status: 'CLEANING',
      patientId: assignment.patientId,
      patientName,
      releasedAt: now.toISOString(),
    })
  } catch (e) {
    return handleEndpointError(e, 'POST /hospitalization/beds/[id]/release')
  }
}
