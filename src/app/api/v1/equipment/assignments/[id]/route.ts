import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentAssignments } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentAssignmentUpdateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error
    const { id } = await params
    const [row] = await getDb().select().from(equipmentAssignments).where(and(eq(equipmentAssignments.id, id), isNull(equipmentAssignments.deletedAt))).limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/assignments/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:assign')
    if ('error' in auth) return auth.error
    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentAssignmentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['assignedToType', 'assignedToId', 'assignedToName', 'department', 'notes', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.startedAt !== undefined && body.startedAt) fields.startedAt = new Date(body.startedAt)
    if (body.endedAt !== undefined) fields.endedAt = body.endedAt ? new Date(body.endedAt) : null

    const [row] = await getDb().update(equipmentAssignments).set(fields).where(and(eq(equipmentAssignments.id, id), isNull(equipmentAssignments.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_assignment', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    if (row.endedAt && !body.endedAt) {
      await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'RELEASED', user: auth.user, details: { assignmentId: row.id }, facilityId: row.facilityId })
    }
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/assignments/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error
    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentAssignments).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentAssignments.id, id), isNull(equipmentAssignments.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_assignment', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/assignments/[id]')
  }
}
