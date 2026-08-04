import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { purchaseOrders, purchaseOrderItems, equipmentSuppliers, supplyBatches, stockMovements } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, logError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, notifyStaff } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { purchaseOrderUpdateSchema, normalizeNum, PO_STATUSES } from '@/lib/api-schemas-equipment'

const itemSelect = {
  id: purchaseOrderItems.id,
  orderId: purchaseOrderItems.orderId,
  itemType: purchaseOrderItems.itemType,
  supplyId: purchaseOrderItems.supplyId,
  sparePartId: purchaseOrderItems.sparePartId,
  equipmentId: purchaseOrderItems.equipmentId,
  description: purchaseOrderItems.description,
  quantity: purchaseOrderItems.quantity,
  unitPrice: purchaseOrderItems.unitPrice,
  totalPrice: purchaseOrderItems.totalPrice,
  receivedQuantity: purchaseOrderItems.receivedQuantity,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error
    const { id } = await params

    const [row] = await getDb()
      .select({
        id: purchaseOrders.id,
        facilityId: purchaseOrders.facilityId,
        orderNumber: purchaseOrders.orderNumber,
        supplierId: purchaseOrders.supplierId,
        supplierName: equipmentSuppliers.name,
        orderDate: purchaseOrders.orderDate,
        expectedDate: purchaseOrders.expectedDate,
        receivedDate: purchaseOrders.receivedDate,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        currency: purchaseOrders.currency,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
      })
      .from(purchaseOrders)
      .leftJoin(equipmentSuppliers, eq(purchaseOrders.supplierId, equipmentSuppliers.id))
      .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt)))
      .limit(1)
    if (!row) return apiError(404, 'Purchase order not found')

    const items = await getDb().select(itemSelect).from(purchaseOrderItems).where(and(eq(purchaseOrderItems.orderId, id), isNull(purchaseOrderItems.deletedAt))).orderBy(purchaseOrderItems.createdAt)

    const movements = await getDb().select({ id: stockMovements.id, supplyId: stockMovements.supplyId, movementType: stockMovements.movementType, quantity: stockMovements.quantity, referenceId: stockMovements.referenceId, createdAt: stockMovements.createdAt }).from(stockMovements).where(and(eq(stockMovements.referenceId, id), isNull(stockMovements.deletedAt))).orderBy(stockMovements.createdAt)

    return NextResponse.json({ ...row, items, movements })
  } catch (e) {
    logError('GET /supplies/orders/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const parsed = await parseJsonBody(request, purchaseOrderUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['supplierId', 'orderDate', 'expectedDate', 'receivedDate', 'status', 'currency', 'notes', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.totalAmount !== undefined && body.totalAmount !== null) fields.totalAmount = normalizeNum(body.totalAmount)

    const [row] = await db.update(purchaseOrders).set(fields).where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt))).returning()
    if (!row) return apiError(404, 'Purchase order not found')

    if (Array.isArray(body.items)) {
      await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id))
      if (body.items.length > 0) {
        await db.insert(purchaseOrderItems).values(body.items.map(it => ({
          id: crypto.randomUUID(),
          facilityId: row.facilityId,
          orderId: id,
          itemType: it.itemType || 'supply',
          supplyId: it.supplyId || null,
          sparePartId: it.sparePartId || null,
          equipmentId: it.equipmentId || null,
          description: it.description,
          quantity: Math.round(it.quantity),
          unitPrice: Math.round(normalizeNum(it.unitPrice) ?? 0),
          totalPrice: Math.round(it.quantity) * Math.round(normalizeNum(it.unitPrice) ?? 0),
          receivedQuantity: Math.round(normalizeNum(it.receivedQuantity) ?? 0),
          createdBy: auth.user.sub,
          updatedBy: auth.user.sub,
          createdAt: now,
          updatedAt: now,
        })))
      }
    }

    if (row.status === 'RECEIVED' && !row.receivedDate) {
      await db.update(purchaseOrders).set({ receivedDate: now.toISOString().slice(0, 10), updatedAt: now }).where(eq(purchaseOrders.id, id))
    }

    if (row.status === 'RECEIVED' || row.status === 'PARTIAL') {
      const items = await db.select({ id: purchaseOrderItems.id, supplyId: purchaseOrderItems.supplyId, itemType: purchaseOrderItems.itemType, quantity: purchaseOrderItems.quantity, receivedQuantity: purchaseOrderItems.receivedQuantity, unitPrice: purchaseOrderItems.unitPrice }).from(purchaseOrderItems).where(and(eq(purchaseOrderItems.orderId, id), isNull(purchaseOrderItems.deletedAt)))
      for (const it of items) {
        if (it.itemType === 'supply' && it.supplyId && it.receivedQuantity > 0) {
          const [batch] = await db.insert(supplyBatches).values({
            id: crypto.randomUUID(),
            facilityId: row.facilityId,
            supplyId: it.supplyId,
            quantity: it.receivedQuantity,
            receivedDate: now.toISOString().slice(0, 10),
            purchaseOrderId: id,
            createdBy: auth.user.sub,
            updatedBy: auth.user.sub,
            createdAt: now,
            updatedAt: now,
          }).returning({ id: supplyBatches.id })
          await db.insert(stockMovements).values({
            id: crypto.randomUUID(),
            facilityId: row.facilityId,
            supplyId: it.supplyId,
            batchId: batch.id,
            movementType: 'RECEIPT',
            quantity: it.receivedQuantity,
            unitCost: it.unitPrice,
            reason: `Réception commande ${row.orderNumber}`,
            referenceId: id,
            createdBy: auth.user.sub,
            updatedBy: auth.user.sub,
            createdAt: now,
            updatedAt: now,
          })
          await notifyStaff({
            facilityId: row.facilityId,
            title: 'Commande réceptionnée',
            message: `Réception de ${it.receivedQuantity} unités (commande ${row.orderNumber}).`,
            type: 'INFO',
            roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
          })
        }
      }
    }

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'purchase_order', resourceId: row.id, details: { orderNumber: row.orderNumber, status: row.status } })
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /supplies/orders/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const now = new Date()
    const db = getDb()
    const [row] = await db.update(purchaseOrders).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deletedAt))).returning()
    if (!row) return apiError(404, 'Purchase order not found')
    await db.update(purchaseOrderItems).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(eq(purchaseOrderItems.orderId, id))
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'purchase_order', resourceId: row.id, details: { orderNumber: row.orderNumber } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /supplies/orders/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
