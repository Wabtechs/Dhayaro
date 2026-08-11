import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentAudits, medicalEquipment, users } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentAuditUpdateSchema } from '@/lib/api-schemas-equipment'

const AUDIT_SELECT = {
  id: equipmentAudits.id,
  facilityId: equipmentAudits.facilityId,
  equipmentId: equipmentAudits.equipmentId,
  auditType: equipmentAudits.auditType,
  auditedByUserId: equipmentAudits.auditedByUserId,
  auditDate: equipmentAudits.auditDate,
  status: equipmentAudits.status,
  findings: equipmentAudits.findings,
  nextAuditDate: equipmentAudits.nextAuditDate,
  notes: equipmentAudits.notes,
  organizationId: equipmentAudits.organizationId,
  createdBy: equipmentAudits.createdBy,
  updatedBy: equipmentAudits.updatedBy,
  createdAt: equipmentAudits.createdAt,
  updatedAt: equipmentAudits.updatedAt,
  deletedAt: equipmentAudits.deletedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
  auditedByName: users.firstname,
  auditedByLastname: users.lastname,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:audit')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(AUDIT_SELECT)
      .from(equipmentAudits)
      .leftJoin(medicalEquipment, eq(equipmentAudits.equipmentId, medicalEquipment.id))
      .leftJoin(users, eq(equipmentAudits.auditedByUserId, users.id))
      .where(and(eq(equipmentAudits.id, id), isNull(equipmentAudits.deletedAt)))
      .limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/audits/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:audit')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentAuditUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['equipmentId', 'auditType', 'auditedByUserId', 'auditDate', 'status', 'findings', 'nextAuditDate', 'notes', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }

    const [row] = await getDb().update(equipmentAudits).set(fields).where(and(eq(equipmentAudits.id, id), isNull(equipmentAudits.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_audit', resourceId: row.id, details: { equipmentId: row.equipmentId, auditType: row.auditType } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `AUDIT_${row.auditType}`, user: auth.user, details: { auditId: row.id, status: row.status }, facilityId: row.facilityId })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/audits/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:audit')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentAudits).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentAudits.id, id), isNull(equipmentAudits.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_audit', resourceId: row.id, details: { equipmentId: row.equipmentId, auditType: row.auditType } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/audits/[id]')
  }
}
