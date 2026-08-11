import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, desc, and, count, SQL } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { parsePagination, handleEndpointError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)
    const status = searchParams.get('status') || ''

    const baseConditions: (SQL | undefined)[] = [eq(syncQueue.userId, auth.user.sub)]
    if (status) baseConditions.push(eq(syncQueue.status, status))

    const where = and(...baseConditions)

    const [totalResult, items, pendingResult, syncedResult, failedResult] = await Promise.all([
      getDb().select({ value: count() }).from(syncQueue).where(where),
      getDb().select().from(syncQueue).where(where).orderBy(desc(syncQueue.createdAt)).limit(size).offset(offset),
      getDb().select({ value: count() }).from(syncQueue).where(and(eq(syncQueue.userId, auth.user.sub), eq(syncQueue.status, 'pending'))),
      getDb().select({ value: count() }).from(syncQueue).where(and(eq(syncQueue.userId, auth.user.sub), eq(syncQueue.status, 'synced'))),
      getDb().select({ value: count() }).from(syncQueue).where(and(eq(syncQueue.userId, auth.user.sub), eq(syncQueue.status, 'failed'))),
    ])

    const total = totalResult[0]?.value ?? 0
    const pendingCount = pendingResult[0]?.value ?? 0
    const syncedCount = syncedResult[0]?.value ?? 0
    const failedCount = failedResult[0]?.value ?? 0

    return NextResponse.json({ items, total, page, size, pendingCount, syncedCount, failedCount })
  } catch (e) {
return handleEndpointError(e, 'GET /sync/pull')
  }
}
