import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { beds, bedAssignments, patients } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError, enforceFacilityAccess } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody } from '@/lib/api-schemas'
import { z } from 'zod'

const assignBodySchema = z.object({
  patientId: z.string().min(1, 'PatientId invalide'),
  episodeId: z.string().nullish(),
  notes: z.string().nullish(),
})

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

    const parsed = await parseJsonBody(request, assignBodySchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId as string)
    if (!patientId) return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: "L'identifiant du patient est invalide." })

    const episodeId = body.episodeId ? sanitizeUuid(body.episodeId) : null
    const db = getDb()
    const now = new Date()

    const bed = await db
      .select({ id: beds.id, facilityId: beds.facilityId, bedNumber: beds.bedNumber, room: beds.room, status: beds.status, isActive: beds.isActive })
      .from(beds)
      .where(eq(beds.id, bedId))
      .limit(1)

    if (bed.length === 0) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    const current = bed[0]

    const facilityId = enforceFacilityAccess(current, auth).facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && current.facilityId !== facilityId) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    if (!current.isActive) return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: 'Ce lit est désactivé.' })
    if (current.status === 'OCCUPIED') return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: 'Ce lit est déjà occupé.' })
    if (current.status === 'OUT_OF_SERVICE') return apiErrorResponse('VALIDATION_ERROR', 422, { bedId: 'Ce lit est hors service.' })

    const patient = await db
      .select({ id: patients.id, facilityId: patients.facilityId, firstname: patients.firstname, lastname: patients.lastname })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1)

    if (patient.length === 0) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    const p = patient[0]

    const patientFacility = enforceFacilityAccess(p, auth).facilityId
    if (auth.user.role !== 'SUPER_ADMIN' && p.facilityId !== patientFacility) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const existingActive = await db
      .select({ id: bedAssignments.id })
      .from(bedAssignments)
      .where(and(eq(bedAssignments.patientId, patientId), eq(bedAssignments.status, 'ACTIVE'), eq(bedAssignments.isActive, true)))
      .limit(1)

    if (existingActive.length > 0) {
      return apiErrorResponse('VALIDATION_ERROR', 422, { patientId: 'Ce patient est déjà hospitalisé dans un autre lit.' })
    }

    const assignmentId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(bedAssignments).values({
        id: assignmentId,
        facilityId: current.facilityId,
        bedId: current.id,
        patientId,
        episodeId: episodeId || null,
        assignedById: auth.user.sub,
        assignedAt: now,
        releasedAt: null,
        status: 'ACTIVE',
        notes: body.notes || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })

      await tx.update(beds).set({ status: 'OCCUPIED', updatedAt: now }).where(eq(beds.id, current.id))
    })

    const patientName = `${p.firstname || ''} ${p.lastname || ''}`.trim()
    await logAudit(auth.user, 'CREATE', 'bed_assignment', assignmentId, { bedId: current.id, bedNumber: current.bedNumber, patientId, episodeId: episodeId || null })

    await logPatientEvent({
      facilityId: current.facilityId,
      patientId,
      episodeId: episodeId || undefined,
      eventType: 'HOSPITALIZATION_ADMITTED',
      title: EVENT_TITLES.HOSPITALIZATION_ADMITTED,
      description: `Admission au lit ${current.bedNumber || current.room} (${current.label || '—'})`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
      metadata: {
        bedId: current.id,
        bedNumber: current.bedNumber,
        room: current.room,
        floor: current.floor,
        department: current.department,
        episodeId: episodeId || null,
      },
    })

    return NextResponse.json({
      assignmentId,
      bedId: current.id,
      bedNumber: current.bedNumber,
      patientId,
      patientName,
      status: 'OCCUPIED',
      episodeId: episodeId || null,
      assignedAt: now.toISOString(),
    }, { status: 201 })
  } catch (e) {
    return handleEndpointError(e, 'POST /hospitalization/beds/[id]/assign')
  }
}
