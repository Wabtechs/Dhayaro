import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'

const FACILITY_KEYS = ['name', 'code', 'facilityType', 'address', 'city', 'phone', 'email', 'bedCount', 'departmentCount', 'staffCount'] as const

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

    const [row] = await getDb().select().from(facilities).where(eq(facilities.id, validId)).limit(1)

    if (!row) {
      return apiError(404, 'Facility not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /facilities/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const body = await request.json()
    const allowedFields = pickAllowedKeys(body, FACILITY_KEYS)
    allowedFields.updatedAt = new Date()

    const [updated] = await getDb()
      .update(facilities)
      .set(allowedFields)
      .where(eq(facilities.id, validId))
      .returning()

    if (!updated) {
      return apiError(404, 'Facility not found')
    }

    await logAudit(auth.user, 'UPDATE', 'facility', validId, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /facilities/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [deleted] = await getDb()
      .update(facilities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(facilities.id, validId))
      .returning()

    if (!deleted) {
      return apiError(404, 'Facility not found')
    }

    await logAudit(auth.user, 'DELETE', 'facility', validId, { isActive: false })

    return NextResponse.json({ detail: 'Facility deleted' })
  } catch (e) {
    logError('DELETE /facilities/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
