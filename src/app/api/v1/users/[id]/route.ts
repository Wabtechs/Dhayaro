import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, userUpdateSchema } from '@/lib/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { userId: "L'identifiant de l'utilisateur est invalide." })

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
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /users/[id]')
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
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { userId: "L'identifiant de l'utilisateur est invalide." })

    const parsed = await parseJsonBody(request, userUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const MULTI_FACILITY_ROLES = ['SUPER_ADMIN', 'ADMIN']
    const targetRole = body.role as string | undefined
    if (targetRole && !MULTI_FACILITY_ROLES.includes(targetRole)) {
      const fid = body.facilityId !== undefined ? sanitizeUuid(body.facilityId) : undefined
      if (fid !== undefined && !fid) {
        return apiErrorResponse('VALIDATION_ERROR', 422, { facilityId: "L'identifiant de l'établissement ne peut pas être vide pour ce rôle." })
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
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'UPDATE', 'user', validId, { role: updated.role })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /users/[id]')
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
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { userId: "L'identifiant de l'utilisateur est invalide." })

    const [result] = await getDb()
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, validId))
      .returning({ id: users.id })

    if (!result) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await logAudit(auth.user, 'DELETE', 'user', validId)

    return NextResponse.json({ success: true, id: result.id })
  } catch (e) {
return handleEndpointError(e, 'DELETE /users/[id]')
  }
}
