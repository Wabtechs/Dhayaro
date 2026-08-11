import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { medicalSupplies, supplyBatches, equipmentSuppliers } from '@/lib/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, stockStatus } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { medicalSupplyUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error
    const { id } = await params

    const [row] = await getDb()
      .select({
        id: medicalSupplies.id,
        facilityId: medicalSupplies.facilityId,
        name: medicalSupplies.name,
        code: medicalSupplies.code,
        sku: medicalSupplies.sku,
        category: medicalSupplies.category,
        description: medicalSupplies.description,
        unit: medicalSupplies.unit,
        minStock: medicalSupplies.minStock,
        criticalStock: medicalSupplies.criticalStock,
        price: medicalSupplies.price,
        currency: medicalSupplies.currency,
        supplierId: medicalSupplies.supplierId,
        isActive: medicalSupplies.isActive,
        createdAt: medicalSupplies.createdAt,
        updatedAt: medicalSupplies.updatedAt,
        supplierName: equipmentSuppliers.name,
      })
      .from(medicalSupplies)
      .leftJoin(equipmentSuppliers, eq(medicalSupplies.supplierId, equipmentSuppliers.id))
      .where(and(eq(medicalSupplies.id, id), isNull(medicalSupplies.deletedAt)))
      .limit(1)
    if (!row) return apiError(404, 'Supply not found')

    const [[stockResult], [expiryResult], batches] = await Promise.all([
      getDb().select({ total: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)` }).from(supplyBatches).where(and(eq(supplyBatches.supplyId, id), isNull(supplyBatches.deletedAt))),
      getDb().select({ total: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)` }).from(supplyBatches).where(and(eq(supplyBatches.supplyId, id), isNull(supplyBatches.deletedAt), sql`${supplyBatches.expiryDate} < current_date`)),
      getDb().select().from(supplyBatches).where(and(eq(supplyBatches.supplyId, id), isNull(supplyBatches.deletedAt))).orderBy(sql`${supplyBatches.expiryDate} asc nulls last`),
    ])

    const qty = stockResult?.total ?? 0
    return NextResponse.json({
      ...row,
      stockQuantity: qty,
      expiredQuantity: expiryResult?.total ?? 0,
      status: stockStatus(qty, row.minStock, row.criticalStock),
      batches,
    })
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/items/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const parsed = await parseJsonBody(request, medicalSupplyUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['name', 'code', 'sku', 'description', 'unit', 'currency', 'facilityId'] as const
    const uuidKeys = ['supplierId'] as const
    const numKeys = ['minStock', 'criticalStock', 'price'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of uuidKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    for (const k of numKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = normalizeNum(body[k])
    }
    if (body.category !== undefined && body.category) fields.category = body.category
    if (body.isActive !== undefined && body.isActive !== null) fields.isActive = body.isActive

    const [row] = await getDb().update(medicalSupplies).set(fields).where(and(eq(medicalSupplies.id, id), isNull(medicalSupplies.deletedAt))).returning()
    if (!row) return apiError(404, 'Supply not found')
    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'medical_supply', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /supplies/items/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(medicalSupplies).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(medicalSupplies.id, id), isNull(medicalSupplies.deletedAt))).returning()
    if (!row) return apiError(404, 'Supply not found')
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'medical_supply', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /supplies/items/[id]')
  }
}
