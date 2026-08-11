import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { notifications } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { parseJsonBody, notificationsReadSchema } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, notificationsReadSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    if (!body.ids && !body.all) {
      return apiErrorResponse('VALIDATION_ERROR', 422, { ids: 'Indiquez les identifiants des notifications à marquer comme lues ou passez all=true.' })
    }

    const conditions = [eq(notifications.userId, auth.user.sub)]

    if (body.all) {
      conditions.push(eq(notifications.isRead, false))
    } else if (Array.isArray(body.ids)) {
      const validIds = body.ids.filter((id: unknown) => sanitizeUuid(id) !== null)
      if (validIds.length === 0) {
        return apiErrorResponse('VALIDATION_ERROR', 422, { ids: 'Aucun identifiant de notification valide fourni.' })
      }
      conditions.push(inArray(notifications.id, validIds))
    }

    const updated = await getDb()
      .update(notifications)
      .set({ isRead: true })
      .where(and(...conditions))
      .returning()

    return NextResponse.json({ success: true, data: { updated: updated.length }, message: `${updated.length} notification(s) marquée(s) comme lue(s).` })
  } catch (e) {
return handleEndpointError(e, 'POST /notifications/read')
  }
}
