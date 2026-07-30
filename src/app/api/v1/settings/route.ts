import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError, logError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const [user] = await getDb()
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, auth.user.sub))
      .limit(1)

    if (!user) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json({ preferences: user.preferences || {} })
  } catch (e) {
    logError('GET /settings', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const preferences = body.preferences

    if (!preferences || typeof preferences !== 'object') {
      return apiError(400, 'preferences object is required')
    }

    await getDb()
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, auth.user.sub))

    return NextResponse.json({ preferences })
  } catch (e) {
    logError('PUT /settings', e)
    return apiError(500, 'Internal server error')
  }
}
