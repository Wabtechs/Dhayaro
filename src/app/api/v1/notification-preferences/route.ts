import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { notificationPreferences, users } from '@/lib/schema'
import { eq, desc, and, or, ilike, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, notificationPreferenceCreateSchema, notificationPreferenceUpdateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(users.firstname, `%${search}%`),
        ilike(users.lastname, `%${search}%`),
        ilike(users.email, `%${search}%`),
      )!)
    }

    const userId = sanitizeUuid(searchParams.get('userId'))
    if (userId) conditions.push(eq(notificationPreferences.userId, userId))

    const facilityFilter = addFacilityFilter(notificationPreferences.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(notificationPreferences).where(whereClause),
      getDb().select({
        id: notificationPreferences.id,
        userId: notificationPreferences.userId,
        soundEnabled: notificationPreferences.soundEnabled,
        volume: notificationPreferences.volume,
        notificationTypes: notificationPreferences.notificationTypes,
        services: notificationPreferences.services,
        isActive: notificationPreferences.isActive,
        createdAt: notificationPreferences.createdAt,
        updatedAt: notificationPreferences.updatedAt,
        userFirstname: users.firstname,
        userLastname: users.lastname,
        userEmail: users.email,
      })
      .from(notificationPreferences)
      .leftJoin(users, eq(notificationPreferences.userId, users.id))
      .where(whereClause)
      .orderBy(desc(notificationPreferences.createdAt))
      .limit(size)
      .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /notification-preferences', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE', 'LABORATORY', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, notificationPreferenceCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const userCheck = await db.select({ id: users.id }).from(users).where(eq(users.id, body.userId)).limit(1)
    if (userCheck.length === 0) {
      return apiError(400, 'User not found')
    }

    const [row] = await db.insert(notificationPreferences).values({
      userId: body.userId,
      soundEnabled: body.soundEnabled ?? true,
      volume: body.volume ?? 50,
      notificationTypes: body.notificationTypes ?? ['INFO', 'WARNING', 'SUCCESS', 'ERROR'],
      services: body.services ?? ['LABORATORY', 'PHARMACY', 'IMAGERY', 'HOSPITALIZATION', 'RECEPTION', 'ADMINISTRATION'],
      isActive: true,
      facilityId: facilityId || null,
createdAt: now,
        updatedAt: now,
      } as any).returning()

    await logAudit(auth.user, 'CREATE', 'notification_preference', row.id, { userId: row.userId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /notification-preferences', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}