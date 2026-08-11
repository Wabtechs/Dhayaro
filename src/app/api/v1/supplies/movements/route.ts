import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { stockMovements, supplyBatches, medicalSupplies } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count, sql } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, notifyStaff } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { stockMovementCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: stockMovements.id,
  facilityId: stockMovements.facilityId,
  supplyId: stockMovements.supplyId,
  batchId: stockMovements.batchId,
  movementType: stockMovements.movementType,
  quantity: stockMovements.quantity,
  unitCost: stockMovements.unitCost,
  fromLocation: stockMovements.fromLocation,
  toLocation: stockMovements.toLocation,
  reason: stockMovements.reason,
  referenceId: stockMovements.referenceId,
  createdAt: stockMovements.createdAt,
  supplyName: medicalSupplies.name,
  supplyCode: medicalSupplies.code,
}

async function deductFefo(supplyId: string, qty: number, facilityId: string | null): Promise<{ ok: boolean; reason?: string }> {
  const db = getDb()
  const [[{ available }]] = await Promise.all([
    db.select({ available: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)` }).from(supplyBatches)
      .where(and(eq(supplyBatches.supplyId, supplyId), isNull(supplyBatches.deletedAt))),
  ])
  if ((available ?? 0) < qty) {
    return { ok: false, reason: 'Stock insuffisant pour la quantité demandée' }
  }
  const batches = await db.select({ id: supplyBatches.id, quantity: supplyBatches.quantity })
    .from(supplyBatches)
    .where(and(eq(supplyBatches.supplyId, supplyId), isNull(supplyBatches.deletedAt), sql`${supplyBatches.quantity} > 0`))
    .orderBy(sql`${supplyBatches.expiryDate} asc nulls last`)

  let remaining = qty
  for (const b of batches) {
    if (remaining <= 0) break
    const take = Math.min(b.quantity, remaining)
    await db.update(supplyBatches).set({ quantity: b.quantity - take, updatedAt: new Date() }).where(eq(supplyBatches.id, b.id))
    remaining -= take
  }
  void facilityId
  return { ok: true }
}

async function addToBatch(supplyId: string, qty: number, batchId: string | null | undefined, facilityId: string | null): Promise<string> {
  const db = getDb()
  if (batchId) {
    await db.update(supplyBatches).set({ quantity: sql`${supplyBatches.quantity} + ${qty}`, updatedAt: new Date() }).where(eq(supplyBatches.id, batchId))
    return batchId
  }
  const [row] = await db.insert(supplyBatches).values({
    id: crypto.randomUUID(),
    facilityId: facilityId || undefined,
    supplyId,
    quantity: qty,
    receivedDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning({ id: supplyBatches.id })
  return row.id
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const supplyId = searchParams.get('supplyId')
    const movementType = searchParams.get('movementType')

    const conditions: any[] = [isNull(stockMovements.deletedAt)]
    if (supplyId) conditions.push(eq(stockMovements.supplyId, supplyId))
    if (movementType) conditions.push(eq(stockMovements.movementType, movementType as never))
    if (search) {
      conditions.push(or(
        ilike(stockMovements.reason, `%${search}%`),
        ilike(medicalSupplies.name, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(stockMovements.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(stockMovements).leftJoin(medicalSupplies, eq(stockMovements.supplyId, medicalSupplies.id)).where(whereClause),
      getDb().select(SELECT)
        .from(stockMovements)
        .leftJoin(medicalSupplies, eq(stockMovements.supplyId, medicalSupplies.id))
        .where(whereClause)
        .orderBy(desc(stockMovements.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/movements')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, stockMovementCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const supplyCheck = await getDb().select({ id: medicalSupplies.id, name: medicalSupplies.name, minStock: medicalSupplies.minStock }).from(medicalSupplies).where(and(eq(medicalSupplies.id, body.supplyId), isNull(medicalSupplies.deletedAt))).limit(1)
    if (!supplyCheck[0]) return apiError(400, 'Supply not found')

    const qty = Math.abs(Math.round(body.quantity))
    if (qty <= 0) return apiError(400, 'La quantité doit être supérieure à zéro')

    const facilityId = enforceFacilityAccess(body, auth).facilityId
    const now = new Date()
    const type = body.movementType as string

    let batchId: string | null = body.batchId || null

    if (type === 'ISSUE' || type === 'TRANSFER_OUT' || type === 'EXPIRED' || type === 'ADJUSTMENT' && Math.sign(body.quantity) < 0) {
      const res = await deductFefo(body.supplyId, qty, facilityId)
      if (!res.ok) return apiError(400, res.reason ?? 'Stock insuffisant')
    } else {
      batchId = await addToBatch(body.supplyId, qty, batchId, facilityId)
    }

    const [row] = await getDb().insert(stockMovements).values({
      id: crypto.randomUUID(),
      facilityId,
      supplyId: body.supplyId,
      batchId,
      movementType: type as never,
      quantity: body.quantity,
      unitCost: normalizeNum(body.unitCost),
      fromLocation: body.fromLocation || null,
      toLocation: body.toLocation || null,
      reason: body.reason || null,
      referenceId: body.referenceId || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'stock_movement', resourceId: row.id, details: { supplyId: row.supplyId, type: row.movementType, quantity: row.quantity } })

    const [[{ remaining }]] = await Promise.all([
      getDb().select({ remaining: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)` }).from(supplyBatches).where(and(eq(supplyBatches.supplyId, body.supplyId), isNull(supplyBatches.deletedAt))),
    ])
    const remainingQty = remaining ?? 0
    if (remainingQty <= supplyCheck[0].minStock) {
      await notifyStaff({
        facilityId,
        title: 'Stock faible',
        message: `Le stock de « ${supplyCheck[0].name} » est à ${remainingQty} unités (seuil : ${supplyCheck[0].minStock}).`,
        type: 'WARNING',
        roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
      })
    }

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /supplies/movements')
  }
}
