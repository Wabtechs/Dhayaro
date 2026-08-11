import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { medicalSupplies, supplyBatches, equipmentSuppliers } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count, sql, inArray } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit, stockStatus } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { medicalSupplyCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
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
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const category = searchParams.get('category')
    const supplierId = searchParams.get('supplierId')
    const alerts = searchParams.get('alerts')

    const conditions: any[] = [isNull(medicalSupplies.deletedAt)]
    if (search) {
      conditions.push(or(
        ilike(medicalSupplies.name, `%${search}%`),
        ilike(medicalSupplies.code, `%${search}%`),
        ilike(medicalSupplies.sku, `%${search}%`),
      )!)
    }
    if (category) conditions.push(eq(medicalSupplies.category, category as never))
    if (supplierId) conditions.push(eq(medicalSupplies.supplierId, supplierId))

    const facilityFilter = addFacilityFilter(medicalSupplies.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(medicalSupplies).where(whereClause),
      getDb().select(SELECT)
        .from(medicalSupplies)
        .leftJoin(equipmentSuppliers, eq(medicalSupplies.supplierId, equipmentSuppliers.id))
        .where(whereClause)
        .orderBy(desc(medicalSupplies.createdAt))
        .limit(size)
        .offset(offset),
    ])

    const supplyIds = items.map(i => i.id)
    const stockRows = supplyIds.length > 0
      ? await getDb()
          .select({ supplyId: supplyBatches.supplyId, total: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)` })
          .from(supplyBatches)
          .where(and(inArray(supplyBatches.supplyId, supplyIds), isNull(supplyBatches.deletedAt)))
          .groupBy(supplyBatches.supplyId)
      : []

    const stockBySupply = new Map<string, number>()
    for (const s of stockRows) {
      stockBySupply.set(s.supplyId, s.total ?? 0)
    }
    for (const id of supplyIds) {
      if (!stockBySupply.has(id)) stockBySupply.set(id, 0)
    }

    const result = items.map(item => {
      const qty = stockBySupply.get(item.id) ?? 0
      const status = alerts === 'true'
        ? stockStatus(qty, item.minStock, item.criticalStock)
        : undefined
      return { ...item, stockQuantity: qty, ...(status ? { status } : {}) }
    })

    return NextResponse.json({ items: result, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/items')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplies:manage')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, medicalSupplyCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(medicalSupplies).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      name: body.name,
      code: body.code || null,
      sku: body.sku || null,
      category: body.category || 'OTHER',
      description: body.description || null,
      unit: body.unit || 'piece',
      minStock: normalizeNum(body.minStock) ?? 0,
      criticalStock: normalizeNum(body.criticalStock) ?? 0,
      price: normalizeNum(body.price),
      currency: body.currency || 'CDF',
      supplierId: body.supplierId || null,
      isActive: body.isActive ?? true,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'medical_supply', resourceId: row.id, details: { name: row.name, code: row.code } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /supplies/items')
  }
}
