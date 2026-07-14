import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { syncQueue } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 })
    }

    const items = await getDb()
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.userId, payload.sub))
      .orderBy(desc(syncQueue.createdAt))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
