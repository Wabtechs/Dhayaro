import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { beds, bedAssignments, patients } from '@/lib/schema'
import { and, count, eq, ilike, or } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError, parsePagination, addFacilityFilter, enforceFacilityAccess } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, bedCreateSchema } from '@/lib/api-schemas'
import { sanitizeUuid, sanitizeSearch } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search: rawSearch, offset } = parsePagination(searchParams)
    const search = sanitizeSearch(rawSearch)

    const conditions = []

    const status = searchParams.get('status')
    if (status) {
      conditions.push(eq(beds.status, status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'OUT_OF_SERVICE' | 'RESERVED'))
    }

    const department = searchParams.get('department')
    if (department) conditions.push(eq(beds.department, department))

    const floor = searchParams.get('floor')
    if (floor) conditions.push(eq(beds.floor, floor))

    const room = searchParams.get('room')
    if (room) conditions.push(eq(beds.room, room))

    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      conditions.push(eq(beds.isActive, isActive !== 'false'))
    }

    const facilityFilter = addFacilityFilter(beds.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    if (search) {
      conditions.push(or(
        ilike(beds.bedNumber, `%${search}%`),
        ilike(beds.room, `%${search}%`),
        ilike(beds.label, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(beds).where(whereClause),
      getDb()
        .select({
          id: beds.id,
          facilityId: beds.facilityId,
          locationId: beds.locationId,
          bedNumber: beds.bedNumber,
          floor: beds.floor,
          room: beds.room,
          department: beds.department,
          label: beds.label,
          type: beds.type,
          status: beds.status,
          notes: beds.notes,
          isActive: beds.isActive,
          createdAt: beds.createdAt,
          updatedAt: beds.updatedAt,
          assignmentId: bedAssignments.id,
          patientId: bedAssignments.patientId,
          episodeId: bedAssignments.episodeId,
          assignedAt: bedAssignments.assignedAt,
          assignmentStatus: bedAssignments.status,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
        })
        .from(beds)
        .leftJoin(
          bedAssignments,
          and(
            eq(bedAssignments.bedId, beds.id),
            eq(bedAssignments.status, 'ACTIVE'),
            eq(bedAssignments.isActive, true),
          ),
        )
        .leftJoin(patients, eq(bedAssignments.patientId, patients.id))
        .where(whereClause)
        .orderBy(beds.room, beds.bedNumber)
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
    return handleEndpointError(e, 'GET /hospitalization/beds')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, bedCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const bedNumber = (body.bedNumber || '').trim()
    if (!bedNumber) return apiErrorResponse('VALIDATION_ERROR', 422, { bedNumber: 'Le numéro de lit est requis.' })

    const { facilityId } = enforceFacilityAccess(body, auth)
    const db = getDb()
    const now = new Date()

    if (facilityId && bedNumber) {
      const existing = await db
        .select({ id: beds.id })
        .from(beds)
        .where(and(eq(beds.facilityId, facilityId), eq(beds.bedNumber, bedNumber), eq(beds.room, body.room || '')))
        .limit(1)
      if (existing.length > 0) {
        return apiErrorResponse('VALIDATION_ERROR', 422, { bedNumber: 'Un lit avec ce numéro existe déjà dans cette chambre.' })
      }
    }

    const type = (body.type as string) || 'WARD'
    const [row] = await db.insert(beds).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      locationId: body.locationId ? sanitizeUuid(body.locationId) : null,
      bedNumber,
      floor: body.floor || null,
      room: body.room || null,
      department: body.department || null,
      label: body.label || null,
      type: type as 'WARD' | 'PRIVATE' | 'SEMI_PRIVATE' | 'ICU' | 'MATERNITY' | 'PEDIATRIC' | 'OTHER',
      status: 'AVAILABLE',
      notes: body.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'bed', row.id, { bedNumber, room: row.room, type: row.type })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    return handleEndpointError(e, 'POST /hospitalization/beds')
  }
}
