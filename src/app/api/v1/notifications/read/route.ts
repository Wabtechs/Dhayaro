import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { notifications } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.ids && !body.all) {
      return apiError(400, 'ids array or all=true is required')
    }

    const conditions = [eq(notifications.userId, auth.user.sub)]

    if (body.all) {
      conditions.push(eq(notifications.isRead, false))
    } else if (Array.isArray(body.ids)) {
      const validIds = body.ids.filter((id: unknown) => sanitizeUuid(id) !== null)
      if (validIds.length === 0) {
        return apiError(400, 'No valid notification ids provided')
      }
      conditions.push(inArray(notifications.id, validIds))
    }

    const updated = await getDb()
      .update(notifications)
      .set({ isRead: true })
      .where(and(...conditions))
      .returning()

    return NextResponse.json({ detail: `${updated.length} notification(s) marked as read` })
  } catch (e) {
    logError('POST /notifications/read', e)
    return apiError(500, 'Internal server error')
  }
}
