import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { supplyBatches, medicalSupplies, equipmentSuppliers } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { supplyBatchUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error
    const { id } = await params
    const [row] = await getDb()
      .select({
        id: supplyBatches.id,
        facilityId: supplyBatches.facilityId,
        supplyId: supplyBatches.supplyId,
        batchNumber: supplyBatches.batchNumber,
        lotNumber: supplyBatches.lotNumber,
        manufacturerDate: supplyBatches.manufacturerDate,
        expiryDate: supplyBatches.expiryDate,
        quantity: supplyBatches.quantity,
        receivedDate: supplyBatches.receivedDate,
        supplierId: supplyBatches.supplierId,
        purchaseOrderId: supplyBatches.purchaseOrderId,
        createdAt: supplyBatches.createdAt,
        updatedAt: supplyBatches.updatedAt,
        supplyName: medicalSupplies.name,
        supplierName: equipmentSuppliers.name,
      })
      .from(supplyBatches)
      .leftJoin(medicalSupplies, eq(supplyBatches.supplyId, medicalSupplies.id))
      .leftJoin(equipmentSuppliers, eq(supplyBatches.supplierId, equipmentSuppliers.id))
      .where(and(eq(supplyBatches.id, id), isNull(supplyBatches.deletedAt)))
      .limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/batches/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const parsed = await parseJsonBody(request, supplyBatchUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['supplyId', 'batchNumber', 'lotNumber', 'manufacturerDate', 'expiryDate', 'receivedDate', 'supplierId', 'purchaseOrderId', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') fields.quantity = normalizeNum(body.quantity)

    const [row] = await getDb().update(supplyBatches).set(fields).where(and(eq(supplyBatches.id, id), isNull(supplyBatches.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'supply_batch', resourceId: row.id, details: { supplyId: row.supplyId, quantity: row.quantity } })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /supplies/batches/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(supplyBatches).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(supplyBatches.id, id), isNull(supplyBatches.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'supply_batch', resourceId: row.id, details: { supplyId: row.supplyId } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /supplies/batches/[id]')
  }
}
