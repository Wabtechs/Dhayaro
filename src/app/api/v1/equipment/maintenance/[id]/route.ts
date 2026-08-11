import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentMaintenance, medicalEquipment, users } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentMaintenanceUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: equipmentMaintenance.id,
  facilityId: equipmentMaintenance.facilityId,
  equipmentId: equipmentMaintenance.equipmentId,
  maintenanceType: equipmentMaintenance.maintenanceType,
  status: equipmentMaintenance.status,
  scheduledDate: equipmentMaintenance.scheduledDate,
  startedAt: equipmentMaintenance.startedAt,
  completedAt: equipmentMaintenance.completedAt,
  technicianUserId: equipmentMaintenance.technicianUserId,
  technicianName: equipmentMaintenance.technicianName,
  company: equipmentMaintenance.company,
  cost: equipmentMaintenance.cost,
  currency: equipmentMaintenance.currency,
  durationHours: equipmentMaintenance.durationHours,
  priority: equipmentMaintenance.priority,
  report: equipmentMaintenance.report,
  photos: equipmentMaintenance.photos,
  partsReplaced: equipmentMaintenance.partsReplaced,
  signature: equipmentMaintenance.signature,
  notes: equipmentMaintenance.notes,
  createdAt: equipmentMaintenance.createdAt,
  updatedAt: equipmentMaintenance.updatedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
  technicianFirstname: users.firstname,
  technicianLastname: users.lastname,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(SELECT)
      .from(equipmentMaintenance)
      .leftJoin(medicalEquipment, eq(equipmentMaintenance.equipmentId, medicalEquipment.id))
      .leftJoin(users, eq(equipmentMaintenance.technicianUserId, users.id))
      .where(and(eq(equipmentMaintenance.id, id), isNull(equipmentMaintenance.deletedAt)))
      .limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/maintenance/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:maintenance')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentMaintenanceUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: equipmentMaintenance.id, equipmentId: equipmentMaintenance.equipmentId, status: equipmentMaintenance.status, facilityId: equipmentMaintenance.facilityId }).from(equipmentMaintenance).where(and(eq(equipmentMaintenance.id, id), isNull(equipmentMaintenance.deletedAt))).limit(1)
    if (!existing[0]) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['equipmentId', 'maintenanceType', 'status', 'scheduledDate', 'technicianUserId', 'technicianName', 'company', 'currency', 'priority', 'report', 'signature', 'notes', 'facilityId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.startedAt !== undefined && body.startedAt !== null && body.startedAt !== '') fields.startedAt = new Date(body.startedAt)
    if (body.completedAt !== undefined && body.completedAt !== null && body.completedAt !== '') fields.completedAt = new Date(body.completedAt)
    if (body.cost !== undefined && body.cost !== null && body.cost !== '') fields.cost = normalizeNum(body.cost)
    if (body.durationHours !== undefined && body.durationHours !== null && body.durationHours !== '') fields.durationHours = normalizeNum(body.durationHours)
    if (body.photos !== undefined && body.photos !== null) fields.photos = body.photos
    if (body.partsReplaced !== undefined && body.partsReplaced !== null) fields.partsReplaced = body.partsReplaced

    const newStatus = (fields.status as string) || existing[0].status
    if (newStatus === 'COMPLETED' && !fields.completedAt) {
      fields.completedAt = now
    }

    const [row] = await getDb().update(equipmentMaintenance).set(fields).where(and(eq(equipmentMaintenance.id, id), isNull(equipmentMaintenance.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    if (newStatus === 'COMPLETED') {
      await getDb().update(medicalEquipment).set({ status: 'AVAILABLE', updatedBy: auth.user.sub, updatedAt: now }).where(eq(medicalEquipment.id, row.equipmentId))
    } else if (newStatus !== 'CANCELLED') {
      const [equip] = await getDb().select({ status: medicalEquipment.status }).from(medicalEquipment).where(eq(medicalEquipment.id, row.equipmentId)).limit(1)
      if (equip && !['MAINTENANCE', 'BROKEN', 'RETIRED', 'LOST'].includes(equip.status)) {
        await getDb().update(medicalEquipment).set({ status: 'MAINTENANCE', updatedBy: auth.user.sub, updatedAt: now }).where(eq(medicalEquipment.id, row.equipmentId))
      }
    }

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_maintenance', resourceId: row.id, details: { equipmentId: row.equipmentId, maintenanceType: row.maintenanceType, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `MAINTENANCE_${row.status}`, user: auth.user, details: { maintenanceId: row.id, maintenanceType: row.maintenanceType }, facilityId: row.facilityId })

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/maintenance/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:maintenance')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentMaintenance).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentMaintenance.id, id), isNull(equipmentMaintenance.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_maintenance', resourceId: row.id, details: { equipmentId: row.equipmentId, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'MAINTENANCE_DELETED', user: auth.user, details: { maintenanceId: row.id }, facilityId: row.facilityId })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/maintenance/[id]')
  }
}
