import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentAudits, medicalEquipment, users } from '@/lib/schema'
import { eq, and, desc, isNull, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentAuditCreateSchema } from '@/lib/api-schemas-equipment'

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:audit')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')
    const auditType = searchParams.get('auditType')

    const conditions: any[] = [isNull(equipmentAudits.deletedAt)]
    if (equipmentId) conditions.push(eq(equipmentAudits.equipmentId, equipmentId))
    if (auditType) conditions.push(eq(equipmentAudits.auditType, auditType as never))

    const facilityFilter = addFacilityFilter(equipmentAudits.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentAudits).where(whereClause),
      getDb().select(AUDIT_SELECT)
        .from(equipmentAudits)
        .leftJoin(medicalEquipment, eq(equipmentAudits.equipmentId, medicalEquipment.id))
        .leftJoin(users, eq(equipmentAudits.auditedByUserId, users.id))
        .where(whereClause)
        .orderBy(desc(equipmentAudits.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/audits', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:audit')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentAuditCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentAudits).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      equipmentId: body.equipmentId,
      auditType: body.auditType || 'STATUS_CHECK',
      auditedByUserId: body.auditedByUserId || auth.user.sub,
      auditDate: body.auditDate,
      status: body.status || 'GOOD',
      findings: body.findings ?? [],
      nextAuditDate: body.nextAuditDate || null,
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_audit', resourceId: row.id, details: { equipmentId: row.equipmentId, auditType: row.auditType } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `AUDIT_${row.auditType}`, user: auth.user, details: { auditId: row.id, status: row.status }, facilityId: row.facilityId })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/audits', e)
    return apiError(500, 'Internal server error')
  }
}
