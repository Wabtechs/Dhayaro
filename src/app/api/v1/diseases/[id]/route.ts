import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diseases } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody, diseaseUpdateSchema } from '@/lib/api-schemas'

const DISEASE_KEYS = ['code', 'name', 'category', 'description', 'symptoms', 'complications', 'treatments', 'isContagious', 'severity'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb().select().from(diseases).where(eq(diseases.id, validId)).limit(1)

    if (!row) {
      return apiError(404, 'Disease not found')
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /diseases/[id]')
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const parsed = await parseJsonBody(request, diseaseUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const allowedFields = pickAllowedKeys(body, DISEASE_KEYS)

    const [updated] = await getDb()
      .update(diseases)
      .set(allowedFields)
      .where(eq(diseases.id, validId))
      .returning()

    if (!updated) {
      return apiError(404, 'Disease not found')
    }

    await logAudit(auth.user, 'UPDATE', 'disease', validId, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /diseases/[id]')
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [deleted] = await getDb()
      .update(diseases)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(diseases.id, validId))
      .returning()

    if (!deleted) {
      return apiError(404, 'Disease not found')
    }

    await logAudit(auth.user, 'DELETE', 'disease', validId, { isActive: false })

    return NextResponse.json({ detail: 'Disease deleted' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /diseases/[id]')
  }
}
