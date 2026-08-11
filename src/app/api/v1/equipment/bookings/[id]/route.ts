import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentBookings } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentBookingUpdateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(equipmentBookings).where(and(eq(equipmentBookings.id, id), isNull(equipmentBookings.deletedAt))).limit(1)
    if (!row) return apiError(404, 'Booking not found')
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/bookings/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentBookingUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: equipmentBookings.id, equipmentId: equipmentBookings.equipmentId, status: equipmentBookings.status, facilityId: equipmentBookings.facilityId }).from(equipmentBookings).where(and(eq(equipmentBookings.id, id), isNull(equipmentBookings.deletedAt))).limit(1)
    if (!existing[0]) return apiError(404, 'Booking not found')

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['purpose', 'notes', 'assignedToName', 'status', 'facilityId'] as const
    const uuidKeys = ['equipmentId', 'bookedByUserId', 'assignedToId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of uuidKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.startTime !== undefined && body.startTime) fields.startTime = new Date(body.startTime)
    if (body.endTime !== undefined && body.endTime) fields.endTime = new Date(body.endTime)

    const [row] = await getDb().update(equipmentBookings).set(fields).where(and(eq(equipmentBookings.id, id), isNull(equipmentBookings.deletedAt))).returning()
    if (!row) return apiError(404, 'Booking not found')

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_booking', resourceId: row.id, details: { equipmentId: row.equipmentId, status: row.status } })
    if (body.status && body.status !== existing[0].status) {
      await logEquipmentEvent({ equipmentId: row.equipmentId, action: `BOOKING_${row.status}`, user: auth.user, details: { bookingId: row.id, from: existing[0].status, to: row.status }, facilityId: row.facilityId })
    }
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/bookings/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentBookings).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentBookings.id, id), isNull(equipmentBookings.deletedAt))).returning()
    if (!row) return apiError(404, 'Booking not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_booking', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'BOOKING_DELETED', user: auth.user, details: { bookingId: row.id }, facilityId: row.facilityId })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/bookings/[id]')
  }
}
