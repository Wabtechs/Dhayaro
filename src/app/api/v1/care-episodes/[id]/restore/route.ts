import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiErrorResponse('VALIDATION_ERROR', 422, { episodeId: "L'identifiant de l'épisode est invalide." })

    const db = getDb()

    const conditions = [eq(careEpisodes.id, episodeId)]
    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({
      id: careEpisodes.id,
      isArchived: careEpisodes.isArchived,
    }).from(careEpisodes).where(and(...conditions)).limit(1)

    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    if (!existing.isArchived) return apiErrorResponse('VALIDATION_ERROR', 422, { episodeId: 'Cet épisode n\'est pas archivé.' })

    const [row] = await db.update(careEpisodes).set({
      isArchived: false,
      updatedAt: new Date(),
    }).where(eq(careEpisodes.id, episodeId)).returning()

    await logAudit(auth.user, 'UPDATE', 'care_episode', episodeId, {
      action: 'RESTORE',
      wasArchived: true,
    })

    await logPatientEvent({
      facilityId: row.facilityId,
      patientId: row.patientId,
      episodeId: row.id,
      eventType: 'EPISODE_RESTORED',
      title: EVENT_TITLES.EPISODE_RESTORED,
      description: `Épisode restauré`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { episodeId: row.id },
    })

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PATCH /care-episodes/[id]/restore')
  }
}
