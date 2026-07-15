import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { hashPassword, requireAuth, requireRole } from '@/lib/auth'

const USER_KEYS = ['firstname', 'lastname', 'email', 'role', 'facilityId', 'isActive'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb()
      .select({
        id: users.id,
        facilityId: users.facilityId,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        facilityName: facilities.name,
        facilityType: facilities.facilityType,
      })
      .from(users)
      .leftJoin(facilities, eq(users.facilityId, facilities.id))
      .where(eq(users.id, id))
      .limit(1)

    if (!row) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /users/[id]', e)
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
    const allowedFields = pickAllowedKeys(body, USER_KEYS)

    if (body.password) {
      allowedFields.passwordHash = await hashPassword(body.password)
    }

    const [updated] = await getDb()
      .update(users)
      .set(allowedFields)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        facilityId: users.facilityId,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    if (!updated) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json(updated)
  } catch (e: unknown) {
    logError('PUT /users/[id]', e)
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
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json({ detail: 'User deleted' })
  } catch (e) {
    logError('DELETE /users/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
