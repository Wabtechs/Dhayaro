import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { medicalEquipment, equipmentCategories, users } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, logEquipmentEvent, generateEquipmentCode, generateQrCode } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { medicalEquipmentCreateSchema, medicalEquipmentUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const EQUIPMENT_SELECT = {
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
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const state = searchParams.get('state')

    const conditions: any[] = [isNull(medicalEquipment.deletedAt)]

    if (search) {
      conditions.push(or(
        ilike(medicalEquipment.name, `%${search}%`),
        ilike(medicalEquipment.code, `%${search}%`),
        ilike(medicalEquipment.serialNumber, `%${search}%`),
        ilike(medicalEquipment.manufacturer, `%${search}%`),
        ilike(medicalEquipment.model, `%${search}%`),
      )!)
    }
    if (status) conditions.push(eq(medicalEquipment.status, status as never))
    if (categoryId) conditions.push(eq(medicalEquipment.categoryId, categoryId))
    if (type) conditions.push(eq(medicalEquipment.type, type as never))
    if (state) conditions.push(eq(medicalEquipment.state, state as never))

    const facilityFilter = addFacilityFilter(medicalEquipment.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(medicalEquipment).where(whereClause),
      getDb().select(EQUIPMENT_SELECT)
        .from(medicalEquipment)
        .leftJoin(equipmentCategories, eq(medicalEquipment.categoryId, equipmentCategories.id))
        .leftJoin(users, eq(medicalEquipment.responsibleUserId, users.id))
        .where(whereClause)
        .orderBy(desc(medicalEquipment.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/items')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:create')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, medicalEquipmentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const code = (body.code as string)?.trim() || generateEquipmentCode()
    const now = new Date()

    const [row] = await getDb().insert(medicalEquipment).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      code,
      qrCode: body.qrCode || generateQrCode(code, ''),
      barcode: body.barcode || null,
      name: body.name,
      description: body.description || null,
      type: body.type || 'BIOMEDICAL',
      categoryId: body.categoryId || null,
      subCategoryId: body.subCategoryId || null,
      manufacturer: body.manufacturer || null,
      brand: body.brand || null,
      model: body.model || null,
      serialNumber: body.serialNumber || null,
      purchaseDate: body.purchaseDate || null,
      purchasePrice: normalizeNum(body.purchasePrice),
      currency: body.currency || 'CDF',
      warrantyMonths: normalizeNum(body.warrantyMonths),
      lifecycleYears: normalizeNum(body.lifecycleYears),
      state: body.state || 'NEW',
      status: body.status || 'AVAILABLE',
      photo: body.photo || null,
      responsibleUserId: body.responsibleUserId || null,
      locationId: body.locationId || null,
      building: body.building || null,
      floor: body.floor || null,
      department: body.department || null,
      room: body.room || null,
      position: body.position || null,
      commissioningDate: body.commissioningDate || null,
      retirementDate: body.retirementDate || null,
      comments: body.comments || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await getDb().update(medicalEquipment).set({ qrCode: generateQrCode(row.code, row.id) }).where(eq(medicalEquipment.id, row.id))
    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'medical_equipment', resourceId: row.id, details: { code: row.code, name: row.name } })
    await logEquipmentEvent({ equipmentId: row.id, action: 'CREATED', user: auth.user, details: { code: row.code }, facilityId: row.facilityId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /equipment/items')
  }
}
