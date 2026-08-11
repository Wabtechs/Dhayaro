import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auditLogs, users } from '@/lib/schema'
import { eq, desc, and, or, ilike, count } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'
import { addFacilityFilter, parsePagination, handleEndpointError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(auditLogs.action, `%${search}%`),
        ilike(auditLogs.resource, `%${search}%`),
      )!)
    }
    const facilityFilter = addFacilityFilter(auditLogs.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(auditLogs)
      .where(whereClause)

    const items = await getDb()
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        facilityId: auditLogs.facilityId,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        timestamp: auditLogs.timestamp,
        userFirstname: users.firstname,
        userLastname: users.lastname,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(size)
      .offset(offset)

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
return handleEndpointError(e, 'GET /audit')
  }
}
