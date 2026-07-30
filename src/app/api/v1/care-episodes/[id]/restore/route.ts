import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()

    const conditions = [eq(careEpisodes.id, episodeId)]
    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({
      id: careEpisodes.id,
      isArchived: careEpisodes.isArchived,
    }).from(careEpisodes).where(and(...conditions)).limit(1)

    if (!existing) return apiError(404, 'Episode not found')
    if (!existing.isArchived) return apiError(400, 'Episode is not archived')

    const [row] = await db.update(careEpisodes).set({
      isArchived: false,
      updatedAt: new Date(),
    }).where(eq(careEpisodes.id, episodeId)).returning()

    await logAudit(auth.user, 'UPDATE', 'care_episode', episodeId, {
      action: 'RESTORE',
      wasArchived: true,
    })

    return NextResponse.json(row)
  } catch (e) {
    logError('PATCH /care-episodes/[id]/restore', e)
    return apiError(500, 'Internal server error')
  }
}
