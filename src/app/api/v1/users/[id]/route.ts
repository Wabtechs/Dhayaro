import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

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
      .where(eq(users.id, validId))
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const body = await request.json()

    if (body.role !== undefined) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST']
      if (!validRoles.includes(body.role)) {
        return apiError(400, `role must be one of: ${validRoles.join(', ')}`)
      }
    }

    const MULTI_FACILITY_ROLES = ['SUPER_ADMIN', 'ADMIN']
    const targetRole = body.role as string | undefined
    if (targetRole && !MULTI_FACILITY_ROLES.includes(targetRole)) {
      const fid = body.facilityId !== undefined ? sanitizeUuid(body.facilityId) : undefined
      if (fid !== undefined && !fid) {
        return apiError(400, 'facilityId cannot be empty for this role')
      }
    }

    const set: Record<string, unknown> = { updatedAt: new Date() }
    if (body.firstname !== undefined) set.firstname = body.firstname
    if (body.lastname !== undefined) set.lastname = body.lastname
    if (body.email !== undefined) set.email = body.email
    if (body.phone !== undefined) set.phone = body.phone
    if (body.role !== undefined) set.role = body.role
    if (body.facilityId !== undefined) {
      set.facilityId = sanitizeUuid(body.facilityId)
    }
    if (body.specialty !== undefined) set.specialty = body.specialty
    if (body.licenseNumber !== undefined) set.licenseNumber = body.licenseNumber
    if (body.availability !== undefined) set.availability = body.availability
    if (body.isActive !== undefined) set.isActive = body.isActive
    if (body.password) set.passwordHash = await hashPassword(body.password)

    const [updated] = await getDb()
      .update(users)
      .set(set)
      .where(eq(users.id, validId))
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

    await logAudit(auth.user, 'UPDATE', 'user', validId, { role: updated.role })

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
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [result] = await getDb()
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, validId))
      .returning({ id: users.id })

    if (!result) {
      return apiError(404, 'User not found')
    }

    await logAudit(auth.user, 'DELETE', 'user', validId)

    return NextResponse.json({ success: true, id: result.id })
  } catch (e) {
    logError('DELETE /users/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
