import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentWarranties, medicalEquipment, equipmentSuppliers } from '@/lib/schema'
import { eq, and, desc, isNull, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentWarrantyCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: equipmentWarranties.id,
  facilityId: equipmentWarranties.facilityId,
  equipmentId: equipmentWarranties.equipmentId,
  supplierId: equipmentWarranties.supplierId,
  startDate: equipmentWarranties.startDate,
  endDate: equipmentWarranties.endDate,
  status: equipmentWarranties.status,
  coverage: equipmentWarranties.coverage,
  terms: equipmentWarranties.terms,
  cost: equipmentWarranties.cost,
  notes: equipmentWarranties.notes,
  createdAt: equipmentWarranties.createdAt,
  updatedAt: equipmentWarranties.updatedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
  supplierName: equipmentSuppliers.name,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')
    const status = searchParams.get('status')

    const conditions: any[] = [isNull(equipmentWarranties.deletedAt)]
    if (equipmentId) conditions.push(eq(equipmentWarranties.equipmentId, equipmentId))
    if (status) conditions.push(eq(equipmentWarranties.status, status as never))

    const facilityFilter = addFacilityFilter(equipmentWarranties.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentWarranties).where(whereClause),
      getDb().select(SELECT)
        .from(equipmentWarranties)
        .leftJoin(medicalEquipment, eq(equipmentWarranties.equipmentId, medicalEquipment.id))
        .leftJoin(equipmentSuppliers, eq(equipmentWarranties.supplierId, equipmentSuppliers.id))
        .where(whereClause)
        .orderBy(desc(equipmentWarranties.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/warranties')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentWarrantyCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentWarranties).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      equipmentId: body.equipmentId,
      supplierId: body.supplierId || null,
      startDate: body.startDate || null,
      endDate: body.endDate,
      status: body.status || 'ACTIVE',
      coverage: body.coverage || null,
      terms: body.terms || null,
      cost: normalizeNum(body.cost),
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_warranty', resourceId: row.id, details: { equipmentId: row.equipmentId } })
    await logEquipmentEvent({ equipmentId: row.equipmentId, action: 'WARRANTY_CREATED', user: auth.user, details: { warrantyId: row.id }, facilityId: row.facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /equipment/warranties')
  }
}
