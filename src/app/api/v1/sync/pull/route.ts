import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const items = await getDb()
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.userId, auth.user.sub))
      .orderBy(desc(syncQueue.createdAt))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
