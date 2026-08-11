import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSql } from '@/lib/db'
import { users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'
import { apiErrorResponse, parsePagination, handleEndpointError, addFacilityFilter } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { parseJsonBody, userCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = [eq(users.isActive, true)]
    if (search) {
      conditions.push(or(
        ilike(users.firstname, `%${search}%`),
        ilike(users.lastname, `%${search}%`),
        ilike(users.email, `%${search}%`),
      )!)
    }

    const roleParam = searchParams.get('role')
    const ROLES = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST'] as const
    if (roleParam && (ROLES as readonly string[]).includes(roleParam)) {
      conditions.push(eq(users.role, roleParam as typeof ROLES[number]))
    }

    const facilityFilter = addFacilityFilter(users.facilityId, auth, searchParams)
    if (facilityFilter) {
      conditions.push(facilityFilter)
    }

    const whereClause = and(...conditions)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(users).where(whereClause),
      getDb().select({
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
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(size)
      .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
return handleEndpointError(e, 'GET /users')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    if (!['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const parsed = await parseJsonBody(request, userCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const MULTI_FACILITY_ROLES = ['SUPER_ADMIN', 'ADMIN']
    if (!MULTI_FACILITY_ROLES.includes(body.role)) {
      const fid = sanitizeUuid(body.facilityId)
      if (!fid) {
        return apiErrorResponse('VALIDATION_ERROR', 422, { facilityId: "L'identifiant de l'établissement est requis pour ce rôle." })
      }
    }

    const passwordHash = await hashPassword(body.password)
    const sql = getSql()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const facilityId = sanitizeUuid(body.facilityId)

    const rows = await sql`
      INSERT INTO users (id, email, firstname, lastname, role, facility_id, password_hash, phone, specialty, license_number, availability, is_active, created_at, updated_at)
      VALUES (${id}, ${body.email}, ${body.firstname}, ${body.lastname}, ${body.role}, ${facilityId}, ${passwordHash}, ${body.phone || null}, ${body.specialty || null}, ${body.licenseNumber || null}, ${body.availability || null}, true, ${now}, ${now})
      RETURNING id, facility_id, firstname, lastname, email, role, phone, specialty, license_number, availability, is_active, created_at, updated_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
return handleEndpointError(e, 'POST /users')
  }
}
