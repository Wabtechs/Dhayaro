import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { purchaseOrders, purchaseOrderItems, equipmentSuppliers } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, notifyStaff } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { purchaseOrderCreateSchema, normalizeNum, PO_STATUSES } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const conditions: any[] = [isNull(purchaseOrders.deletedAt)]
    if (status && (PO_STATUSES as readonly string[]).includes(status)) conditions.push(eq(purchaseOrders.status, status as never))
    if (supplierId) conditions.push(eq(purchaseOrders.supplierId, supplierId))
    if (search) {
      conditions.push(or(
        ilike(purchaseOrders.orderNumber, `%${search}%`),
        ilike(equipmentSuppliers.name, `%${search}%`),
        ilike(purchaseOrders.notes, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(purchaseOrders.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(purchaseOrders).leftJoin(equipmentSuppliers, eq(purchaseOrders.supplierId, equipmentSuppliers.id)).where(whereClause),
      getDb().select({
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
        .where(whereClause)
        .orderBy(desc(purchaseOrders.orderDate))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, purchaseOrderCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const now = new Date()
    const facilityId = enforceFacilityAccess(body, auth).facilityId

    const orderNumber = `PO-${Date.now().toString().slice(-8)}`
    const items = (body.items ?? []).map(it => ({
      itemType: it.itemType || 'supply',
      supplyId: it.supplyId || null,
      sparePartId: it.sparePartId || null,
      equipmentId: it.equipmentId || null,
      description: it.description,
      quantity: Math.round(it.quantity),
      unitPrice: Math.round(normalizeNum(it.unitPrice) ?? 0),
      receivedQuantity: Math.round(normalizeNum(it.receivedQuantity) ?? 0),
    }))
    const totalAmount = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0)

    const [row] = await db.insert(purchaseOrders).values({
      id: crypto.randomUUID(),
      facilityId,
      orderNumber,
      supplierId: body.supplierId || null,
      orderDate: body.orderDate || now.toISOString().slice(0, 10),
      expectedDate: body.expectedDate || null,
      receivedDate: body.receivedDate || null,
      status: body.status,
      totalAmount,
      currency: body.currency || 'CDF',
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    if (items.length > 0) {
      await db.insert(purchaseOrderItems).values(items.map(it => ({
        id: crypto.randomUUID(),
        facilityId,
        orderId: row.id,
        ...it,
        createdBy: auth.user.sub,
        updatedBy: auth.user.sub,
        createdAt: now,
        updatedAt: now,
      })))
    }

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'purchase_order', resourceId: row.id, details: { orderNumber: row.orderNumber, totalAmount: row.totalAmount } })
    return NextResponse.json({ ...row, items }, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /supplies/orders')
  }
}
