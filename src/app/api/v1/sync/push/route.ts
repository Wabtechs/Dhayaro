import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { parseJsonBody, syncPushSchema } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, syncPushSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const ids = body.ids ?? []
    const allIds = body.all === true

    if (!allIds && ids.length === 0) {
      return apiErrorResponse('VALIDATION_ERROR', 422, { ids: 'Indiquez les identifiants à synchroniser ou passez all=true.' })
    }

    const conditions = [eq(syncQueue.userId, auth.user.sub)]

    if (allIds) {
      conditions.push(eq(syncQueue.status, 'pending'))
    } else {
      const validIds = ids.filter((id) => sanitizeUuid(id))
      if (validIds.length === 0) {
        return apiErrorResponse('VALIDATION_ERROR', 422, { ids: 'Aucun identifiant valide fourni.' })
      }
      conditions.push(inArray(syncQueue.id, validIds))
    }

    const updated = await getDb()
      .update(syncQueue)
      .set({
        status: 'synced',
        syncedAt: new Date(),
        errorMessage: null,
      })
      .where(and(...conditions))
      .returning({ id: syncQueue.id })

    return NextResponse.json({ success: true, data: { updated: updated.length }, message: `${updated.length} élément(s) synchronisé(s).` })
  } catch (e) {
return handleEndpointError(e, 'POST /sync/push')
  }
}
