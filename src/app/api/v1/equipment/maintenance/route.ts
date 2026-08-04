import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentMaintenance, medicalEquipment, users } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentMaintenanceCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')
    const status = searchParams.get('status')
    const maintenanceType = searchParams.get('maintenanceType')

    const conditions: any[] = [isNull(equipmentMaintenance.deletedAt)]

    if (equipmentId) conditions.push(eq(equipmentMaintenance.equipmentId, equipmentId))
    if (status) conditions.push(eq(equipmentMaintenance.status, status as never))
    if (maintenanceType) conditions.push(eq(equipmentMaintenance.maintenanceType, maintenanceType as never))
    if (search) {
      conditions.push(or(
        ilike(medicalEquipment.name, `%${search}%`),
        ilike(medicalEquipment.code, `%${search}%`),
        ilike(equipmentMaintenance.technicianName, `%${search}%`),
        ilike(equipmentMaintenance.company, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() })
        .from(equipmentMaintenance)
        .leftJoin(medicalEquipment, eq(equipmentMaintenance.equipmentId, medicalEquipment.id))
        .where(whereClause),
      getDb().select(SELECT)
        .from(equipmentMaintenance)
        .leftJoin(medicalEquipment, eq(equipmentMaintenance.equipmentId, medicalEquipment.id))
        .leftJoin(users, eq(equipmentMaintenance.technicianUserId, users.id))
        .where(whereClause)
        .orderBy(desc(equipmentMaintenance.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/maintenance', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:maintenance')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentMaintenanceCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentMaintenance).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      equipmentId: body.equipmentId,
      maintenanceType: body.maintenanceType || 'PREVENTIVE',
      status: body.status || 'SCHEDULED',
      scheduledDate: body.scheduledDate || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      technicianUserId: body.technicianUserId || null,
      technicianName: body.technicianName || null,
      company: body.company || null,
      cost: normalizeNum(body.cost),
      currency: body.currency || 'CDF',
      durationHours: normalizeNum(body.durationHours),
      priority: body.priority || 'MEDIUM',
      report: body.report || null,
      photos: body.photos || [],
      partsReplaced: body.partsReplaced || [],
      signature: body.signature || null,
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    if (row.status !== 'COMPLETED' && row.status !== 'CANCELLED') {
      const [equip] = await getDb().select({ status: medicalEquipment.status }).from(medicalEquipment).where(eq(medicalEquipment.id, row.equipmentId)).limit(1)
      if (equip && !['MAINTENANCE', 'BROKEN', 'RETIRED', 'LOST'].includes(equip.status)) {
        await getDb().update(medicalEquipment).set({ status: 'MAINTENANCE', updatedBy: auth.user.sub, updatedAt: new Date() }).where(eq(medicalEquipment.id, row.equipmentId))
      }
    }

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_maintenance', resourceId: row.id, details: { equipmentId: row.equipmentId, maintenanceType: row.maintenanceType, status: row.status } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: `MAINTENANCE_${row.status}`, user: auth.user, details: { maintenanceId: row.id, maintenanceType: row.maintenanceType }, facilityId: row.facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/maintenance', e)
    return apiError(500, 'Internal server error')
  }
}
