import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { medicalSupplies, supplyBatches, equipmentSuppliers } from '@/lib/schema'
import { eq, and, or, ilike, isNull, sql, inArray } from 'drizzle-orm'
import { addFacilityFilter, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission } from '@/lib/equipment-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const alerts = searchParams.get('alerts')
    const { page, size, offset, search } = parsePagination(searchParams)

    const conditions: any[] = [isNull(medicalSupplies.deletedAt), eq(medicalSupplies.isActive, true)]
    if (category) conditions.push(eq(medicalSupplies.category, category as never))
    if (search) conditions.push(or(ilike(medicalSupplies.name, `%${search}%`), ilike(medicalSupplies.code, `%${search}%`)))
    const facilityFilter = addFacilityFilter(medicalSupplies.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const supplies = await getDb()
      .select({
        id: medicalSupplies.id,
        facilityId: medicalSupplies.facilityId,
        name: medicalSupplies.name,
        code: medicalSupplies.code,
        sku: medicalSupplies.sku,
        category: medicalSupplies.category,
        unit: medicalSupplies.unit,
        minStock: medicalSupplies.minStock,
        criticalStock: medicalSupplies.criticalStock,
        price: medicalSupplies.price,
        currency: medicalSupplies.currency,
        supplierId: medicalSupplies.supplierId,
        supplierName: equipmentSuppliers.name,
      })
      .from(medicalSupplies)
      .leftJoin(equipmentSuppliers, eq(medicalSupplies.supplierId, equipmentSuppliers.id))
      .where(whereClause)
      .orderBy(medicalSupplies.name)

    const ids = supplies.map(s => s.id)

    const stockRows = ids.length > 0
      ? await getDb()
          .select({
            supplyId: supplyBatches.supplyId,
            total: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)`,
            expired: sql<number>`coalesce(sum(case when ${supplyBatches.expiryDate} < current_date then ${supplyBatches.quantity} else 0 end), 0)`,
            expiringSoon: sql<number>`coalesce(sum(case when ${supplyBatches.expiryDate} is not null and ${supplyBatches.expiryDate} >= current_date and ${supplyBatches.expiryDate} <= current_date + 90 then ${supplyBatches.quantity} else 0 end), 0)`,
          })
          .from(supplyBatches)
          .where(and(inArray(supplyBatches.supplyId, ids), isNull(supplyBatches.deletedAt)))
          .groupBy(supplyBatches.supplyId)
      : []

    const stockMap = new Map<string, { total: number; expired: number; expiringSoon: number }>()
    for (const s of stockRows) {
      stockMap.set(s.supplyId, { total: s.total ?? 0, expired: s.expired ?? 0, expiringSoon: s.expiringSoon ?? 0 })
    }

    const items = supplies.map(s => {
      const st = stockMap.get(s.id) ?? { total: 0, expired: 0, expiringSoon: 0 }
      const status = st.total <= s.criticalStock ? 'critical' : st.total <= s.minStock ? 'low' : 'ok'
      return { ...s, stockQuantity: st.total, expiredQuantity: st.expired, expiringSoonQuantity: st.expiringSoon, status }
    })

    const filtered = alerts === 'true' ? items.filter(i => i.status !== 'ok' || i.expiredQuantity > 0 || i.expiringSoonQuantity > 0) : items

    const totals = {
      totalProducts: supplies.length,
      totalStockUnits: filtered.reduce((acc, i) => acc + i.stockQuantity, 0),
      totalValue: filtered.reduce((acc, i) => acc + (i.stockQuantity ?? 0) * (i.price ?? 0), 0),
      lowCount: filtered.filter(i => i.status === 'low').length,
      criticalCount: filtered.filter(i => i.status === 'critical').length,
      expiredCount: filtered.filter(i => i.expiredQuantity > 0).length,
      expiringSoonCount: filtered.filter(i => i.expiringSoonQuantity > 0).length,
      currency: filtered[0]?.currency || 'CDF',
    }

    const byCategory: Record<string, { products: number; units: number; value: number }> = {}
    for (const i of filtered) {
      const cat = byCategory[i.category] ?? { products: 0, units: 0, value: 0 }
      cat.products += 1
      cat.units += i.stockQuantity ?? 0
      cat.value += (i.stockQuantity ?? 0) * (i.price ?? 0)
      byCategory[i.category] = cat
    }

    return NextResponse.json({ items: filtered.slice(offset, offset + size), total: filtered.length, page, size, totals, byCategory })
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/stock')
  }
}
