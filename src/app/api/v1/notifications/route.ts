import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { notifications } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const conditions = [eq(notifications.userId, auth.user.sub)]

    const whereClause = and(...conditions)

    const [[countResult], [unreadResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(notifications).where(whereClause),
      getDb().select({ value: count() }).from(notifications).where(and(eq(notifications.userId, auth.user.sub), eq(notifications.isRead, false))),
      getDb().select().from(notifications).where(whereClause).orderBy(desc(notifications.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      unreadCount: unreadResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /notifications', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.userId || !body.title || !body.message) {
      return apiError(400, 'userId, title, and message are required')
    }

    const userId = sanitizeUuid(body.userId)
    if (!userId) {
      return apiError(400, 'Invalid userId')
    }

    const now = new Date()

    const [row] = await getDb().insert(notifications).values({
      id: crypto.randomUUID(),
      userId,
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      title: body.title,
      message: body.message,
      type: body.type || 'INFO',
      isRead: false,
      link: body.link || null,
      metadata: body.metadata || {},
      createdAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /notifications', e)
    return apiError(500, 'Internal server error')
  }
}
