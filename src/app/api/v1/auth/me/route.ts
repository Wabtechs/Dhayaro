import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 })
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
        return NextResponse.json({ detail: 'User not found' }, { status: 404 })
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
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
