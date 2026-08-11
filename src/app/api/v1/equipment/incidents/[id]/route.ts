import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentIncidents, medicalEquipment, users } from '@/lib/schema'
import { alias } from 'drizzle-orm/pg-core'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentIncidentUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const reportedByUser = alias(users, 'reportedByUser')
const assignedToUser = alias(users, 'assignedToUser')

const SELECT = {
  id: equipmentIncidents.id,
  facilityId: equipmentIncidents.facilityId,
  equipmentId: equipmentIncidents.equipmentId,
  title: equipmentIncidents.title,
  description: equipmentIncidents.description,
  priority: equipmentIncidents.priority,
  status: equipmentIncidents.status,
  reportedByUserId: equipmentIncidents.reportedByUserId,
  assignedToUserId: equipmentIncidents.assignedToUserId,
  resolvedAt: equipmentIncidents.resolvedAt,
  resolutionNotes: equipmentIncidents.resolutionNotes,
  rootCause: equipmentIncidents.rootCause,
  cost: equipmentIncidents.cost,
  createdAt: equipmentIncidents.createdAt,
  updatedAt: equipmentIncidents.updatedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
  reporterFirstname: reportedByUser.firstname,
  reporterLastname: reportedByUser.lastname,
  assigneeFirstname: assignedToUser.firstname,
  assigneeLastname: assignedToUser.lastname,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(SELECT)
      .from(equipmentIncidents)
      .leftJoin(medicalEquipment, eq(equipmentIncidents.equipmentId, medicalEquipment.id))
      .leftJoin(reportedByUser, eq(equipmentIncidents.reportedByUserId, reportedByUser.id))
      .leftJoin(assignedToUser, eq(equipmentIncidents.assignedToUserId, assignedToUser.id))
      .where(and(eq(equipmentIncidents.id, id), isNull(equipmentIncidents.deletedAt)))
      .limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/incidents/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:maintenance')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentIncidentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: equipmentIncidents.id, equipmentId: equipmentIncidents.equipmentId, status: equipmentIncidents.status, facilityId: equipmentIncidents.facilityId }).from(equipmentIncidents).where(and(eq(equipmentIncidents.id, id), isNull(equipmentIncidents.deletedAt))).limit(1)
    if (!existing[0]) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['equipmentId', 'title', 'description', 'priority', 'status', 'reportedByUserId', 'assignedToUserId', 'resolutionNotes', 'rootCause', 'facilityId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.cost !== undefined && body.cost !== null && body.cost !== '') fields.cost = normalizeNum(body.cost)

    const newStatus = (fields.status as string) || existing[0].status
    if ((newStatus === 'RESOLVED' || newStatus === 'CLOSED') && !fields.resolvedAt) {
      fields.resolvedAt = now
    }

    const [row] = await getDb().update(equipmentIncidents).set(fields).where(and(eq(equipmentIncidents.id, id), isNull(equipmentIncidents.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      await getDb().update(medicalEquipment).set({ status: 'AVAILABLE', updatedBy: auth.user.sub, updatedAt: now }).where(eq(medicalEquipment.id, row.equipmentId))
    } else {
      await getDb().update(medicalEquipment).set({ status: 'BROKEN', updatedBy: auth.user.sub, updatedAt: now }).where(eq(medicalEquipment.id, row.equipmentId))
    }

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_incident', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `INCIDENT_${row.status}`, user: auth.user, details: { incidentId: row.id, priority: row.priority }, facilityId: row.facilityId })

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/incidents/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentIncidents).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentIncidents.id, id), isNull(equipmentIncidents.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_incident', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'INCIDENT_DELETED', user: auth.user, details: { incidentId: row.id }, facilityId: row.facilityId })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/incidents/[id]')
  }
}
