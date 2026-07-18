import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diseases } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const DISEASE_KEYS = ['code', 'name', 'category', 'description', 'symptoms', 'complications', 'treatments', 'isContagious', 'severity'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(diseases).where(eq(diseases.id, id)).limit(1)

    if (!row) {
      return apiError(404, 'Disease not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /diseases/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const allowedFields = pickAllowedKeys(body, DISEASE_KEYS)

    const [updated] = await getDb()
      .update(diseases)
      .set(allowedFields)
      .where(eq(diseases.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Disease not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /diseases/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [deleted] = await getDb()
      .update(diseases)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(diseases.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'Disease not found')
    }

    return NextResponse.json({ detail: 'Disease deleted' })
  } catch (e) {
    logError('DELETE /diseases/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
