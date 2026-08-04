import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentBookings, medicalEquipment } from '@/lib/schema'
import { eq, and, desc, isNull, count, sql } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentBookingCreateSchema } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: equipmentBookings.id,
  facilityId: equipmentBookings.facilityId,
  equipmentId: equipmentBookings.equipmentId,
  bookedByUserId: equipmentBookings.bookedByUserId,
  assignedToName: equipmentBookings.assignedToName,
  assignedToId: equipmentBookings.assignedToId,
  purpose: equipmentBookings.purpose,
  startTime: equipmentBookings.startTime,
  endTime: equipmentBookings.endTime,
  status: equipmentBookings.status,
  notes: equipmentBookings.notes,
  createdAt: equipmentBookings.createdAt,
  updatedAt: equipmentBookings.updatedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')
    const status = searchParams.get('status')

    const conditions: any[] = [isNull(equipmentBookings.deletedAt)]
    if (equipmentId) conditions.push(eq(equipmentBookings.equipmentId, equipmentId))
    if (status) conditions.push(eq(equipmentBookings.status, status as never))

    const facilityFilter = addFacilityFilter(equipmentBookings.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentBookings).where(whereClause),
      getDb().select(SELECT)
        .from(equipmentBookings)
        .leftJoin(medicalEquipment, eq(equipmentBookings.equipmentId, medicalEquipment.id))
        .where(whereClause)
        .orderBy(desc(equipmentBookings.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/bookings', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentBookingCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const facilityId = enforceFacilityAccess(body, auth).facilityId
    const now = new Date()
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    const [overlap] = await getDb()
      .select({ id: equipmentBookings.id })
      .from(equipmentBookings)
      .where(and(
        eq(equipmentBookings.equipmentId, body.equipmentId),
        isNull(equipmentBookings.deletedAt),
        sql`${equipmentBookings.status} NOT IN ('CANCELLED', 'COMPLETED')`,
        sql`${equipmentBookings.startTime} < ${endTime}`,
        sql`${equipmentBookings.endTime} > ${startTime}`,
      ))
      .limit(1)
    if (overlap) return apiError(409, "L'équipement est déjà réservé sur cette période")

    const [row] = await getDb().insert(equipmentBookings).values({
      id: crypto.randomUUID(),
      facilityId,
      equipmentId: body.equipmentId,
      bookedByUserId: body.bookedByUserId || auth.user.sub,
      assignedToName: body.assignedToName || null,
      assignedToId: body.assignedToId || null,
      purpose: body.purpose,
      startTime,
      endTime,
      status: body.status || 'PENDING',
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_booking', resourceId: row.id, details: { equipmentId: row.equipmentId, purpose: row.purpose, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'BOOKING_CREATED', user: auth.user, details: { bookingId: row.id, startTime: row.startTime, endTime: row.endTime }, facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/bookings', e)
    return apiError(500, 'Internal server error')
  }
}
