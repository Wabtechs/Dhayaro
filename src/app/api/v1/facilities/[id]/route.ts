import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody, facilityUpdateSchema } from '@/lib/api-schemas'

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
return handleEndpointError(e, 'GET /facilities/[id]')
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

    const parsed = await parseJsonBody(request, facilityUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
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
return handleEndpointError(e, 'PUT /facilities/[id]')
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
return handleEndpointError(e, 'DELETE /facilities/[id]')
  }
}
