import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentWarranties } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentWarrantyUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(equipmentWarranties).where(and(eq(equipmentWarranties.id, id), isNull(equipmentWarranties.deletedAt))).limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/warranties/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentWarrantyUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: equipmentWarranties.id, equipmentId: equipmentWarranties.equipmentId, status: equipmentWarranties.status, facilityId: equipmentWarranties.facilityId }).from(equipmentWarranties).where(and(eq(equipmentWarranties.id, id), isNull(equipmentWarranties.deletedAt))).limit(1)
    if (!existing[0]) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['startDate', 'endDate', 'coverage', 'terms', 'notes', 'facilityId'] as const
    const uuidKeys = ['equipmentId', 'supplierId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of uuidKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.status !== undefined && body.status !== null && body.status !== '') fields.status = body.status
    if (body.cost !== undefined && body.cost !== null && body.cost !== '') fields.cost = normalizeNum(body.cost)

    const [row] = await getDb().update(equipmentWarranties).set(fields).where(and(eq(equipmentWarranties.id, id), isNull(equipmentWarranties.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_warranty', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    if (body.status && body.status !== existing[0].status) {
      await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'WARRANTY_STATUS_CHANGED', user: auth.user, details: { warrantyId: row.id, from: existing[0].status, to: row.status }, facilityId: row.facilityId })
    }
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/warranties/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentWarranties).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentWarranties.id, id), isNull(equipmentWarranties.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_warranty', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'WARRANTY_DELETED', user: auth.user, details: { warrantyId: row.id }, facilityId: row.facilityId })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/warranties/[id]')
  }
}
