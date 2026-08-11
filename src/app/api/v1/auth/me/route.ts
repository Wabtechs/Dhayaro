import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { apiErrorResponse } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return apiErrorResponse('AUTHENTICATION_FAILED', 401)
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return apiErrorResponse('SESSION_EXPIRED', 401)
    }

    try {
      const rows = await getDb()
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
        .where(eq(users.id, payload.sub))
        .limit(1)

      if (rows.length === 0) {
        return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
      }

      return NextResponse.json(rows[0])
    } catch {
      // DB failed — return decoded JWT info
      return NextResponse.json({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      })
    }
  } catch {
    return apiErrorResponse('SERVER_ERROR', 500)
  }
}
