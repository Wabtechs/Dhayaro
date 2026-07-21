import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
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
        phone: users.phone,
        specialty: users.specialty,
        licenseNumber: users.licenseNumber,
        availability: users.availability,
        avatar: users.avatar,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
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
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    if (!['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return apiError(403, 'Only administrators can update users')
    }

    const { id } = await params
    const body = await request.json()

    const set: Record<string, unknown> = { updated_at: new Date() }
    if (body.firstname !== undefined) set.firstname = body.firstname
    if (body.lastname !== undefined) set.lastname = body.lastname
    if (body.email !== undefined) set.email = body.email
    if (body.phone !== undefined) set.phone = body.phone
    if (body.role !== undefined) set.role = body.role
    if (body.facilityId !== undefined) set.facility_id = sanitizeUuid(body.facilityId)
    if (body.specialty !== undefined) set.specialty = body.specialty
    if (body.licenseNumber !== undefined) set.license_number = body.licenseNumber
    if (body.availability !== undefined) set.availability = body.availability
    if (body.isActive !== undefined) set.is_active = body.isActive
    if (body.password) set.password_hash = await hashPassword(body.password)

    const [updated] = await getDb()
      .update(users)
      .set(set)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        facilityId: users.facilityId,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      })

    if (!updated) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /users/[id]', e)
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

    if (!['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return apiError(403, 'Only administrators can delete users')
    }

    const { id } = await params
    const [result] = await getDb()
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id })

    if (!result) {
      return apiError(404, 'User not found')
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (e) {
    logError('DELETE /users/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
