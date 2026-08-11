import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, handleEndpointError } from '@/lib/api-errors'
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
      return apiError(400, 'ids or all must be provided')
    }

    const conditions = [eq(syncQueue.userId, auth.user.sub)]

    if (allIds) {
      conditions.push(eq(syncQueue.status, 'pending'))
    } else {
      const validIds = ids.filter((id) => sanitizeUuid(id))
      if (validIds.length === 0) {
        return apiError(400, 'No valid ids provided')
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

    return NextResponse.json({ updated: updated.length })
  } catch (e) {
return handleEndpointError(e, 'POST /sync/push')
  }
}
