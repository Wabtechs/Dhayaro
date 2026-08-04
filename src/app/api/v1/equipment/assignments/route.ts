import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentAssignments, medicalEquipment } from '@/lib/schema'
import { eq, and, desc, isNull, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentAssignmentCreateSchema } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: equipmentAssignments.id,
  facilityId: equipmentAssignments.facilityId,
  equipmentId: equipmentAssignments.equipmentId,
  assignedToType: equipmentAssignments.assignedToType,
  assignedToId: equipmentAssignments.assignedToId,
  assignedToName: equipmentAssignments.assignedToName,
  department: equipmentAssignments.department,
  startedAt: equipmentAssignments.startedAt,
  endedAt: equipmentAssignments.endedAt,
  notes: equipmentAssignments.notes,
  createdAt: equipmentAssignments.createdAt,
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
    const active = searchParams.get('active')

    const conditions: any[] = [isNull(equipmentAssignments.deletedAt)]
    if (equipmentId) conditions.push(eq(equipmentAssignments.equipmentId, equipmentId))
    if (active === 'true') conditions.push(isNull(equipmentAssignments.endedAt))

    const facilityFilter = addFacilityFilter(equipmentAssignments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentAssignments).where(whereClause),
      getDb().select(SELECT)
        .from(equipmentAssignments)
        .leftJoin(medicalEquipment, eq(equipmentAssignments.equipmentId, medicalEquipment.id))
        .where(whereClause)
        .orderBy(desc(equipmentAssignments.startedAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/assignments', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:assign')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentAssignmentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const facilityId = enforceFacilityAccess(body, auth).facilityId
    const now = new Date()
    const startedAt = body.startedAt ? new Date(body.startedAt) : now

    // Close any currently active assignment for the same equipment
    await getDb().update(equipmentAssignments)
      .set({ endedAt: now, updatedBy: auth.user.sub, updatedAt: now })
      .where(and(eq(equipmentAssignments.equipmentId, body.equipmentId), isNull(equipmentAssignments.endedAt)))

    const [row] = await getDb().insert(equipmentAssignments).values({
      id: crypto.randomUUID(),
      facilityId,
      equipmentId: body.equipmentId,
      assignedToType: body.assignedToType || 'DEPARTMENT',
      assignedToId: body.assignedToId || null,
      assignedToName: body.assignedToName || null,
      department: body.department || null,
      startedAt,
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_assignment', resourceId: row.id, details: { equipmentId: row.equipmentId, assignedToType: row.assignedToType, assignedToName: row.assignedToName } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'ASSIGNED', user: auth.user, details: { assignedToType: row.assignedToType, assignedToName: row.assignedToName, department: row.department }, facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/assignments', e)
    return apiError(500, 'Internal server error')
  }
}
