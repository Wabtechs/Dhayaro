import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auditLogs, users } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['ADMIN'])
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, parseInt(searchParams.get('size') || '20', 10))
    const offset = (page - 1) * size

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(auditLogs)

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
      .orderBy(desc(auditLogs.timestamp))
      .limit(size)
      .offset(offset)

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
