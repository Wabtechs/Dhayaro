import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { spareParts, sparePartInventory } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { sparePartCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SPARE_PART_SELECT = {
  id: spareParts.id,
  facilityId: spareParts.facilityId,
  code: spareParts.code,
  sku: spareParts.sku,
  name: spareParts.name,
  categoryId: spareParts.categoryId,
  description: spareParts.description,
  unit: spareParts.unit,
  manufacturer: spareParts.manufacturer,
  supplierId: spareParts.supplierId,
  isActive: spareParts.isActive,
  organizationId: spareParts.organizationId,
  createdBy: spareParts.createdBy,
  updatedBy: spareParts.updatedBy,
  createdAt: spareParts.createdAt,
  updatedAt: spareParts.updatedAt,
  deletedAt: spareParts.deletedAt,
  quantity: sparePartInventory.quantity,
  minThreshold: sparePartInventory.minThreshold,
  location: sparePartInventory.location,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const location = searchParams.get('location')

    const conditions: any[] = [isNull(spareParts.deletedAt)]
    if (search) {
      conditions.push(or(
        ilike(spareParts.name, `%${search}%`),
        ilike(spareParts.code, `%${search}%`),
        ilike(spareParts.sku, `%${search}%`),
      )!)
    }
    if (categoryId) conditions.push(eq(spareParts.categoryId, categoryId))
    if (isActive === 'true') conditions.push(eq(spareParts.isActive, true))
    if (isActive === 'false') conditions.push(eq(spareParts.isActive, false))

    const facilityFilter = addFacilityFilter(spareParts.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const inventoryCond: any[] = [eq(sparePartInventory.sparePartId, spareParts.id), isNull(sparePartInventory.deletedAt)]
    if (location) inventoryCond.push(eq(sparePartInventory.location, location))

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(spareParts).where(whereClause),
      getDb().select(SPARE_PART_SELECT)
        .from(spareParts)
        .leftJoin(sparePartInventory, and(...inventoryCond))
        .where(whereClause)
        .orderBy(desc(spareParts.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/spare-parts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, sparePartCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const facilityId = enforceFacilityAccess(body, auth).facilityId
    const [row] = await getDb().insert(spareParts).values({
      id: crypto.randomUUID(),
      facilityId,
      code: body.code || null,
      sku: body.sku || null,
      name: body.name,
      categoryId: body.categoryId || null,
      description: body.description || null,
      unit: body.unit || 'piece',
      manufacturer: body.manufacturer || null,
      supplierId: body.supplierId || null,
      isActive: body.isActive ?? true,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    const invKeys = ['quantity', 'minThreshold', 'unitCost', 'location'] as const
    const hasInventory = invKeys.some((k) => body[k] !== undefined && body[k] !== null && body[k] !== '')
    if (hasInventory) {
      await getDb().insert(sparePartInventory).values({
        id: crypto.randomUUID(),
        facilityId,
        sparePartId: row.id,
        location: body.location || 'MAIN',
        quantity: normalizeNum(body.quantity) ?? 0,
        minThreshold: normalizeNum(body.minThreshold) ?? 0,
        unitCost: normalizeNum(body.unitCost),
        currency: body.currency || 'CDF',
        createdBy: auth.user.sub,
        updatedBy: auth.user.sub,
        createdAt: now,
        updatedAt: now,
      })
    }

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'spare_part', resourceId: row.id, details: { name: row.name, code: row.code } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /equipment/spare-parts')
  }
}
