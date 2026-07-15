import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'

const FACILITY_KEYS = ['name', 'code', 'facilityType', 'address', 'city', 'phone', 'email', 'bedCount', 'departmentCount', 'staffCount'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(facilities).where(eq(facilities.id, id)).limit(1)

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
    const auth = await requireRole(request, ['ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const allowedFields = pickAllowedKeys(body, FACILITY_KEYS)

    const [updated] = await getDb()
      .update(facilities)
      .set(allowedFields)
      .where(eq(facilities.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Facility not found')
    }

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
    const auth = await requireRole(request, ['ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params

    const [deleted] = await getDb()
      .update(facilities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'Facility not found')
    }

    return NextResponse.json({ detail: 'Facility deleted' })
  } catch (e) {
    logError('DELETE /facilities/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
