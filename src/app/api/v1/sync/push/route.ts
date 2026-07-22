import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const ids = (body.ids as string[]) || []
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

    const result = await getDb()
      .update(syncQueue)
      .set({
        status: 'synced',
        syncedAt: new Date(),
        errorMessage: null,
      })
      .where(and(...conditions))

    return NextResponse.json({ updated: result.rowCount ?? 0 })
  } catch (e) {
    logError('POST /sync/push', e)
    return apiError(500, 'Internal server error')
  }
}
