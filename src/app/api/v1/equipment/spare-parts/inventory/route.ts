import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { sparePartInventory, spareParts } from '@/lib/schema'
import { eq, and, desc, isNull, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { normalizeNum } from '@/lib/api-schemas-equipment'

const sparePartInventoryAdjustSchema = z.object({
  sparePartId: z.string().min(1),
  location: z.union([z.string(), z.literal(''), z.null()]).nullish(),
  quantity: z.union([z.number(), z.string(), z.literal(''), z.null()]).nullish(),
  minThreshold: z.union([z.number(), z.string(), z.literal(''), z.null()]).nullish(),
  unitCost: z.union([z.number(), z.string(), z.literal(''), z.null()]).nullish(),
  currency: z.union([z.string(), z.literal(''), z.null()]).nullish(),
  facilityId: z.union([z.uuid(), z.literal(''), z.null()]).nullish(),
})

const INVENTORY_SELECT = {
  id: sparePartInventory.id,
  facilityId: sparePartInventory.facilityId,
  sparePartId: sparePartInventory.sparePartId,
  location: sparePartInventory.location,
  quantity: sparePartInventory.quantity,
  minThreshold: sparePartInventory.minThreshold,
  unitCost: sparePartInventory.unitCost,
  currency: sparePartInventory.currency,
  organizationId: sparePartInventory.organizationId,
  createdBy: sparePartInventory.createdBy,
  updatedBy: sparePartInventory.updatedBy,
  createdAt: sparePartInventory.createdAt,
  updatedAt: sparePartInventory.updatedAt,
  deletedAt: sparePartInventory.deletedAt,
  sparePartName: spareParts.name,
  sparePartCode: spareParts.code,
  sparePartSku: spareParts.sku,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)
    const sparePartId = searchParams.get('sparePartId')
    const location = searchParams.get('location')

    const conditions: any[] = [isNull(sparePartInventory.deletedAt)]
    if (sparePartId) conditions.push(eq(sparePartInventory.sparePartId, sparePartId))
    if (location) conditions.push(eq(sparePartInventory.location, location))

    const facilityFilter = addFacilityFilter(sparePartInventory.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(sparePartInventory).where(whereClause),
      getDb().select(INVENTORY_SELECT)
        .from(sparePartInventory)
        .leftJoin(spareParts, eq(sparePartInventory.sparePartId, spareParts.id))
        .where(whereClause)
        .orderBy(desc(sparePartInventory.updatedAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/spare-parts/inventory', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, sparePartInventoryAdjustSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const facilityId = enforceFacilityAccess(body, auth).facilityId
    const location = body.location || 'MAIN'

    const [existing] = await getDb().select().from(sparePartInventory)
      .where(and(
        eq(sparePartInventory.sparePartId, body.sparePartId),
        eq(sparePartInventory.facilityId, facilityId),
        eq(sparePartInventory.location, location),
        isNull(sparePartInventory.deletedAt),
      ))
      .limit(1)

    if (existing) {
      const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
      if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') fields.quantity = normalizeNum(body.quantity) ?? 0
      if (body.minThreshold !== undefined && body.minThreshold !== null && body.minThreshold !== '') fields.minThreshold = normalizeNum(body.minThreshold) ?? 0
      if (body.unitCost !== undefined && body.unitCost !== null && body.unitCost !== '') fields.unitCost = normalizeNum(body.unitCost)
      if (body.location !== undefined && body.location !== null && body.location !== '') fields.location = body.location
      if (body.currency !== undefined && body.currency !== null && body.currency !== '') fields.currency = body.currency

      const [row] = await getDb().update(sparePartInventory).set(fields).where(eq(sparePartInventory.id, existing.id)).returning()
      await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'spare_part_inventory', resourceId: row.id, details: { sparePartId: body.sparePartId, quantity: fields.quantity } })
      return NextResponse.json(row)
    }

    const [row] = await getDb().insert(sparePartInventory).values({
      id: crypto.randomUUID(),
      facilityId,
      sparePartId: body.sparePartId,
      location,
      quantity: normalizeNum(body.quantity) ?? 0,
      minThreshold: normalizeNum(body.minThreshold) ?? 0,
      unitCost: normalizeNum(body.unitCost),
      currency: body.currency || 'CDF',
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'spare_part_inventory', resourceId: row.id, details: { sparePartId: body.sparePartId, location, quantity: row.quantity } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/spare-parts/inventory', e)
    return apiError(500, 'Internal server error')
  }
}
