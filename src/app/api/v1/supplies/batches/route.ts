import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { supplyBatches, medicalSupplies, equipmentSuppliers } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count, sql } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { supplyBatchCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
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
  supplyCode: medicalSupplies.code,
  supplyCategory: medicalSupplies.category,
  supplierName: equipmentSuppliers.name,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const supplyId = searchParams.get('supplyId')
    const expiring = searchParams.get('expiring') === 'true'

    const conditions: any[] = [isNull(supplyBatches.deletedAt)]
    if (supplyId) conditions.push(eq(supplyBatches.supplyId, supplyId))
    if (search) {
      conditions.push(or(
        ilike(supplyBatches.batchNumber, `%${search}%`),
        ilike(supplyBatches.lotNumber, `%${search}%`),
        ilike(medicalSupplies.name, `%${search}%`),
      )!)
    }
    if (expiring) {
      conditions.push(sql`${supplyBatches.expiryDate} is not null and ${supplyBatches.expiryDate} <= current_date + 90 and ${supplyBatches.expiryDate} >= current_date`)
    }

    const facilityFilter = addFacilityFilter(supplyBatches.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(supplyBatches).leftJoin(medicalSupplies, eq(supplyBatches.supplyId, medicalSupplies.id)).where(whereClause),
      getDb().select(SELECT)
        .from(supplyBatches)
        .leftJoin(medicalSupplies, eq(supplyBatches.supplyId, medicalSupplies.id))
        .leftJoin(equipmentSuppliers, eq(supplyBatches.supplierId, equipmentSuppliers.id))
        .where(whereClause)
        .orderBy(sql`${supplyBatches.expiryDate} asc nulls last`)
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /supplies/batches', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, supplyBatchCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const supplyCheck = await getDb().select({ id: medicalSupplies.id }).from(medicalSupplies).where(and(eq(medicalSupplies.id, body.supplyId), isNull(medicalSupplies.deletedAt))).limit(1)
    if (!supplyCheck[0]) return apiError(400, 'Supply not found')

    const now = new Date()
    const [row] = await getDb().insert(supplyBatches).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      supplyId: body.supplyId,
      batchNumber: body.batchNumber || null,
      lotNumber: body.lotNumber || null,
      manufacturerDate: body.manufacturerDate || null,
      expiryDate: body.expiryDate || null,
      quantity: normalizeNum(body.quantity) ?? 0,
      receivedDate: body.receivedDate || null,
      supplierId: body.supplierId || null,
      purchaseOrderId: body.purchaseOrderId || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'supply_batch', resourceId: row.id, details: { supplyId: row.supplyId, quantity: row.quantity, batchNumber: row.batchNumber } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /supplies/batches', e)
    return apiError(500, 'Internal server error')
  }
}
