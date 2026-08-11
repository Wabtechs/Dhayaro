import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { medicalEquipment, equipmentCategories, users, equipmentLocations, equipmentAssignments, equipmentMaintenance, equipmentIncidents, equipmentWarranties } from '@/lib/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { medicalEquipmentUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const DETAIL_SELECT = {
  id: medicalEquipment.id,
  facilityId: medicalEquipment.facilityId,
  code: medicalEquipment.code,
  qrCode: medicalEquipment.qrCode,
  barcode: medicalEquipment.barcode,
  name: medicalEquipment.name,
  description: medicalEquipment.description,
  type: medicalEquipment.type,
  categoryId: medicalEquipment.categoryId,
  subCategoryId: medicalEquipment.subCategoryId,
  manufacturer: medicalEquipment.manufacturer,
  brand: medicalEquipment.brand,
  model: medicalEquipment.model,
  serialNumber: medicalEquipment.serialNumber,
  purchaseDate: medicalEquipment.purchaseDate,
  purchasePrice: medicalEquipment.purchasePrice,
  currency: medicalEquipment.currency,
  warrantyMonths: medicalEquipment.warrantyMonths,
  lifecycleYears: medicalEquipment.lifecycleYears,
  state: medicalEquipment.state,
  status: medicalEquipment.status,
  photo: medicalEquipment.photo,
  responsibleUserId: medicalEquipment.responsibleUserId,
  locationId: medicalEquipment.locationId,
  building: medicalEquipment.building,
  floor: medicalEquipment.floor,
  department: medicalEquipment.department,
  room: medicalEquipment.room,
  position: medicalEquipment.position,
  commissioningDate: medicalEquipment.commissioningDate,
  retirementDate: medicalEquipment.retirementDate,
  comments: medicalEquipment.comments,
  createdAt: medicalEquipment.createdAt,
  updatedAt: medicalEquipment.updatedAt,
  categoryName: equipmentCategories.name,
  responsibleUserName: users.firstname,
  responsibleUserLastname: users.lastname,
  locationName: equipmentLocations.name,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(DETAIL_SELECT)
      .from(medicalEquipment)
      .leftJoin(equipmentCategories, eq(medicalEquipment.categoryId, equipmentCategories.id))
      .leftJoin(users, eq(medicalEquipment.responsibleUserId, users.id))
      .leftJoin(equipmentLocations, eq(medicalEquipment.locationId, equipmentLocations.id))
      .where(and(eq(medicalEquipment.id, id), isNull(medicalEquipment.deletedAt)))
      .limit(1)
    if (!row) return apiError(404, 'Equipment not found')

    const [assignments, maintenance, incidents, warranties, latestLog] = await Promise.all([
      getDb().select().from(equipmentAssignments).where(eq(equipmentAssignments.equipmentId, id)).orderBy(desc(equipmentAssignments.startedAt)).limit(20),
      getDb().select().from(equipmentMaintenance).where(eq(equipmentMaintenance.equipmentId, id)).orderBy(desc(equipmentMaintenance.scheduledDate)).limit(20),
      getDb().select().from(equipmentIncidents).where(eq(equipmentIncidents.equipmentId, id)).orderBy(desc(equipmentIncidents.createdAt)).limit(20),
      getDb().select().from(equipmentWarranties).where(eq(equipmentWarranties.equipmentId, id)).orderBy(desc(equipmentWarranties.endDate)).limit(10),
      getDb().select().from(equipmentMaintenance).where(eq(equipmentMaintenance.equipmentId, id)).orderBy(desc(equipmentMaintenance.createdAt)).limit(1),
    ])
    void latestLog

    return NextResponse.json({ ...row, assignments, maintenance, incidents, warranties })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/items/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, medicalEquipmentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: medicalEquipment.id, name: medicalEquipment.name, code: medicalEquipment.code }).from(medicalEquipment).where(and(eq(medicalEquipment.id, id), isNull(medicalEquipment.deletedAt))).limit(1)
    if (!existing[0]) return apiError(404, 'Equipment not found')

    const now = new Date()
    const stringKeys = ['code', 'qrCode', 'barcode', 'name', 'description', 'manufacturer', 'brand', 'model', 'serialNumber', 'purchaseDate', 'currency', 'photo', 'building', 'floor', 'department', 'room', 'position', 'commissioningDate', 'retirementDate', 'comments'] as const
    const uuidKeys = ['categoryId', 'subCategoryId', 'responsibleUserId', 'locationId'] as const
    const enumKeys = ['type', 'state', 'status'] as const
    const numKeys = ['purchasePrice', 'warrantyMonths', 'lifecycleYears'] as const

    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of uuidKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of enumKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of numKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = normalizeNum(body[k])
    }

    const [row] = await getDb().update(medicalEquipment).set(fields).where(and(eq(medicalEquipment.id, id), isNull(medicalEquipment.deletedAt))).returning()

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'medical_equipment', resourceId: id, details: { code: row.code, name: row.name } })
    await logEquipmentEvent({ equipmentId: id, action: 'UPDATED', user: auth.user, details: { fields: Object.keys(fields) }, facilityId: row.facilityId })

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/items/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(medicalEquipment).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(medicalEquipment.id, id), isNull(medicalEquipment.deletedAt))).returning()
    if (!row) return apiError(404, 'Equipment not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'medical_equipment', resourceId: id, details: { code: row.code } })
    await logEquipmentEvent({ equipmentId: id, action: 'DELETED', user: auth.user, facilityId: row.facilityId })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/items/[id]')
  }
}
