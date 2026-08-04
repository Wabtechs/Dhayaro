import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { spareParts, sparePartInventory } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, enforceFacilityAccess, logError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { sparePartUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(SPARE_PART_SELECT)
      .from(spareParts)
      .leftJoin(sparePartInventory, and(eq(sparePartInventory.sparePartId, spareParts.id), isNull(sparePartInventory.deletedAt)))
      .where(and(eq(spareParts.id, id), isNull(spareParts.deletedAt)))
      .limit(1)
    if (!row) return apiError(404, 'Spare part not found')
    return NextResponse.json(row)
  } catch (e) {
    logError('GET /equipment/spare-parts/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, sparePartUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['code', 'sku', 'name', 'categoryId', 'description', 'unit', 'manufacturer', 'supplierId', 'isActive', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }

    const [row] = await getDb().update(spareParts).set(fields).where(and(eq(spareParts.id, id), isNull(spareParts.deletedAt))).returning()
    if (!row) return apiError(404, 'Spare part not found')

    const invKeys = ['quantity', 'minThreshold', 'unitCost', 'location'] as const
    const hasInventory = invKeys.some((k) => body[k] !== undefined && body[k] !== null && body[k] !== '')
    if (hasInventory) {
      const facilityId = enforceFacilityAccess(body, auth).facilityId ?? row.facilityId
      const [existing] = await getDb().select().from(sparePartInventory)
        .where(and(
          eq(sparePartInventory.sparePartId, row.id),
          eq(sparePartInventory.facilityId, facilityId),
          isNull(sparePartInventory.deletedAt),
        ))
        .orderBy(sparePartInventory.createdAt)
        .limit(1)

      if (existing) {
        const invFields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
        if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') invFields.quantity = normalizeNum(body.quantity) ?? 0
        if (body.minThreshold !== undefined && body.minThreshold !== null && body.minThreshold !== '') invFields.minThreshold = normalizeNum(body.minThreshold) ?? 0
        if (body.unitCost !== undefined && body.unitCost !== null && body.unitCost !== '') invFields.unitCost = normalizeNum(body.unitCost)
        if (body.location !== undefined && body.location !== null && body.location !== '') invFields.location = body.location
        if (body.currency !== undefined && body.currency !== null && body.currency !== '') invFields.currency = body.currency
        await getDb().update(sparePartInventory).set(invFields).where(eq(sparePartInventory.id, existing.id))
      } else {
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
    }

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'spare_part', resourceId: row.id, details: { name: row.name, code: row.code } })
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /equipment/spare-parts/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(spareParts).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(spareParts.id, id), isNull(spareParts.deletedAt))).returning()
    if (!row) return apiError(404, 'Spare part not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'spare_part', resourceId: row.id, details: { name: row.name, code: row.code } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /equipment/spare-parts/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
