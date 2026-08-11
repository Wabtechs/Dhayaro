import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentIncidents, medicalEquipment, users } from '@/lib/schema'
import { alias } from 'drizzle-orm/pg-core'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentIncidentCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const conditions: any[] = [isNull(equipmentIncidents.deletedAt)]

    if (equipmentId) conditions.push(eq(equipmentIncidents.equipmentId, equipmentId))
    if (status) conditions.push(eq(equipmentIncidents.status, status as never))
    if (priority) conditions.push(eq(equipmentIncidents.priority, priority as never))
    if (search) {
      conditions.push(or(
        ilike(medicalEquipment.name, `%${search}%`),
        ilike(medicalEquipment.code, `%${search}%`),
        ilike(equipmentIncidents.title, `%${search}%`),
        ilike(equipmentIncidents.description, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(equipmentIncidents.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() })
        .from(equipmentIncidents)
        .leftJoin(medicalEquipment, eq(equipmentIncidents.equipmentId, medicalEquipment.id))
        .where(whereClause),
      getDb().select(SELECT)
        .from(equipmentIncidents)
        .leftJoin(medicalEquipment, eq(equipmentIncidents.equipmentId, medicalEquipment.id))
        .leftJoin(reportedByUser, eq(equipmentIncidents.reportedByUserId, reportedByUser.id))
        .leftJoin(assignedToUser, eq(equipmentIncidents.assignedToUserId, assignedToUser.id))
        .where(whereClause)
        .orderBy(desc(equipmentIncidents.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/incidents')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:maintenance')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentIncidentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentIncidents).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      equipmentId: body.equipmentId,
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'MEDIUM',
      status: body.status || 'OPEN',
      reportedByUserId: body.reportedByUserId || auth.user.sub,
      assignedToUserId: body.assignedToUserId || null,
      resolutionNotes: body.resolutionNotes || null,
      rootCause: body.rootCause || null,
      cost: normalizeNum(body.cost),
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_incident', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title, priority: row.priority, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `INCIDENT_${row.status}`, user: auth.user, details: { incidentId: row.id, priority: row.priority }, facilityId: row.facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /equipment/incidents')
  }
}
