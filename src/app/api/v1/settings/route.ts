import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { parseJsonBody, settingsUpdateSchema } from '@/lib/api-schemas'

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
return handleEndpointError(e, 'GET /settings')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, settingsUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const preferences = body.preferences

    await getDb()
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, auth.user.sub))

    return NextResponse.json({ preferences })
  } catch (e) {
return handleEndpointError(e, 'PUT /settings')
  }
}
