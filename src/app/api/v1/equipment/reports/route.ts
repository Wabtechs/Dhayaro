import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import {
  medicalEquipment, equipmentCategories, equipmentMaintenance, equipmentIncidents, equipmentBookings,
  equipmentWarranties, supplyBatches, medicalSupplies, equipmentSuppliers,
  spareParts, sparePartInventory, stockMovements, purchaseOrders,
} from '@/lib/schema'
import { eq, and, isNull, sql, count } from 'drizzle-orm'
import { addFacilityFilter, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission } from '@/lib/equipment-utils'

function compactAnd(...conditions: any[]): any {
  const valid = conditions.filter(c => c !== undefined)
  return valid.length > 0 ? and(...valid) : undefined
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:report')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'inventory'
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))
    const facility = addFacilityFilter
    void facility

    const report: Record<string, unknown> = { type, generatedAt: new Date().toISOString() }

    if (type === 'inventory') {
      const byCategory = await getDb()
        .select({
          categoryId: medicalEquipment.categoryId,
          category: equipmentCategories.name,
          count: count(),
          totalValue: sql<number>`coalesce(sum(${medicalEquipment.purchasePrice}), 0)`,
        })
        .from(medicalEquipment)
        .leftJoin(equipmentCategories, eq(medicalEquipment.categoryId, equipmentCategories.id))
        .where(compactAnd(
          isNull(medicalEquipment.retirementDate),
          addFacilityFilter(medicalEquipment.facilityId, auth, searchParams),
        ))
        .groupBy(medicalEquipment.categoryId, equipmentCategories.name)
        .orderBy(sql`count(*) desc`)

      const byStatus = await getDb()
        .select({ status: medicalEquipment.status, count: count() })
        .from(medicalEquipment)
        .where(compactAnd(
          isNull(medicalEquipment.retirementDate),
          addFacilityFilter(medicalEquipment.facilityId, auth, searchParams),
        ))
        .groupBy(medicalEquipment.status)

      const byState = await getDb()
        .select({ state: medicalEquipment.state, count: count() })
        .from(medicalEquipment)
        .where(compactAnd(
          isNull(medicalEquipment.retirementDate),
          addFacilityFilter(medicalEquipment.facilityId, auth, searchParams),
        ))
        .groupBy(medicalEquipment.state)

      report.byCategory = byCategory
      report.byStatus = byStatus
      report.byState = byState
      report.totals = await getDb()
        .select({
          totalEquipment: count(),
          totalValue: sql<number>`coalesce(sum(${medicalEquipment.purchasePrice}), 0)`,
        })
        .from(medicalEquipment)
        .where(compactAnd(
          isNull(medicalEquipment.retirementDate),
          addFacilityFilter(medicalEquipment.facilityId, auth, searchParams),
        ))
        .then(r => r[0])
    } else if (type === 'supplies') {
      const byCategory = await getDb()
        .select({
          category: medicalSupplies.category,
          products: count(),
          units: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)`,
          value: sql<number>`coalesce(sum(${supplyBatches.quantity} * ${medicalSupplies.price}), 0)`,
        })
        .from(medicalSupplies)
        .leftJoin(supplyBatches, and(eq(supplyBatches.supplyId, medicalSupplies.id), isNull(supplyBatches.deletedAt)))
        .where(compactAnd(
          eq(medicalSupplies.isActive, true),
          isNull(medicalSupplies.deletedAt),
          addFacilityFilter(medicalSupplies.facilityId, auth, searchParams),
        ))
        .groupBy(medicalSupplies.category)

      const totals = await getDb()
        .select({
          totalProducts: count(),
          totalUnits: sql<number>`coalesce(sum(${supplyBatches.quantity}), 0)`,
          totalValue: sql<number>`coalesce(sum(${supplyBatches.quantity} * ${medicalSupplies.price}), 0)`,
        })
        .from(medicalSupplies)
        .leftJoin(supplyBatches, and(eq(supplyBatches.supplyId, medicalSupplies.id), isNull(supplyBatches.deletedAt)))
        .where(compactAnd(
          eq(medicalSupplies.isActive, true),
          isNull(medicalSupplies.deletedAt),
          addFacilityFilter(medicalSupplies.facilityId, auth, searchParams),
        ))

      report.byCategory = byCategory
      report.totals = totals[0]
    } else if (type === 'maintenance') {
      const byType = await getDb()
        .select({
          type: equipmentMaintenance.maintenanceType,
          count: count(),
          totalCost: sql<number>`coalesce(sum(${equipmentMaintenance.cost}), 0)`,
        })
        .from(equipmentMaintenance)
        .where(compactAnd(
          isNull(equipmentMaintenance.deletedAt),
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        ))
        .groupBy(equipmentMaintenance.maintenanceType)

      const byStatus = await getDb()
        .select({ status: equipmentMaintenance.status, count: count() })
        .from(equipmentMaintenance)
        .where(compactAnd(
          isNull(equipmentMaintenance.deletedAt),
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        ))
        .groupBy(equipmentMaintenance.status)

      const byMonth = await getDb()
        .select({
          month: sql<string>`to_char(${equipmentMaintenance.scheduledDate}, 'YYYY-MM')`,
          count: count(),
          totalCost: sql<number>`coalesce(sum(${equipmentMaintenance.cost}), 0)`,
        })
        .from(equipmentMaintenance)
        .where(compactAnd(
          isNull(equipmentMaintenance.deletedAt),
          sql`${equipmentMaintenance.scheduledDate} is not null`,
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        ))
        .groupBy(sql`to_char(${equipmentMaintenance.scheduledDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${equipmentMaintenance.scheduledDate}, 'YYYY-MM')`)

      report.byType = byType
      report.byStatus = byStatus
      report.byMonth = byMonth
      report.totals = await getDb()
        .select({ count: count(), totalCost: sql<number>`coalesce(sum(${equipmentMaintenance.cost}), 0)` })
        .from(equipmentMaintenance)
        .where(compactAnd(
          isNull(equipmentMaintenance.deletedAt),
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        ))
        .then(r => r[0])
    } else if (type === 'utilization') {
      const byStatus = await getDb()
        .select({ status: medicalEquipment.status, count: count() })
        .from(medicalEquipment)
        .where(compactAnd(addFacilityFilter(medicalEquipment.facilityId, auth, searchParams)))
        .groupBy(medicalEquipment.status)

      const bookings = await getDb()
        .select({
          equipmentId: equipmentBookings.equipmentId,
          equipmentName: medicalEquipment.name,
          count: count(),
        })
        .from(equipmentBookings)
        .leftJoin(medicalEquipment, eq(equipmentBookings.equipmentId, medicalEquipment.id))
        .where(compactAnd(
          isNull(equipmentBookings.deletedAt),
          eq(equipmentBookings.status, 'CONFIRMED'),
          addFacilityFilter(equipmentBookings.facilityId, auth, searchParams),
        ))
        .groupBy(equipmentBookings.equipmentId, medicalEquipment.name)
        .orderBy(sql`count(*) desc`)
        .limit(10)

      report.byStatus = byStatus
      report.topBooked = bookings
    } else if (type === 'expiry') {
      const expiring = await getDb()
        .select({
          batchId: supplyBatches.id,
          supplyId: supplyBatches.supplyId,
          supplyName: medicalSupplies.name,
          batchNumber: supplyBatches.batchNumber,
          quantity: supplyBatches.quantity,
          expiryDate: supplyBatches.expiryDate,
          daysLeft: sql<number>`(extract(epoch from (${supplyBatches.expiryDate} - current_date)) / 86400)::int`,
        })
        .from(supplyBatches)
        .leftJoin(medicalSupplies, eq(supplyBatches.supplyId, medicalSupplies.id))
        .where(compactAnd(
          isNull(supplyBatches.deletedAt),
          sql`${supplyBatches.expiryDate} is not null and ${supplyBatches.expiryDate} <= current_date + 180`,
          addFacilityFilter(supplyBatches.facilityId, auth, searchParams),
        ))
        .orderBy(sql`${supplyBatches.expiryDate} asc nulls last`)
        .limit(limit)

      const expired = expiring.filter(e => (e.daysLeft ?? 0) < 0)
      const expiringSoon = expiring.filter(e => (e.daysLeft ?? 0) >= 0 && (e.daysLeft ?? 0) <= 90)

      report.expired = expired
      report.expiringSoon = expiringSoon
      report.expiredCount = expired.length
      report.expiringSoonCount = expiringSoon.length
    } else if (type === 'purchases') {
      const bySupplier = await getDb()
        .select({
          supplierId: purchaseOrders.supplierId,
          supplierName: equipmentSuppliers.name,
          count: count(),
          totalAmount: sql<number>`coalesce(sum(${purchaseOrders.totalAmount}), 0)`,
        })
        .from(purchaseOrders)
        .leftJoin(equipmentSuppliers, eq(purchaseOrders.supplierId, equipmentSuppliers.id))
        .where(compactAnd(
          isNull(purchaseOrders.deletedAt),
          sql`${purchaseOrders.status} in ('ORDERED', 'PARTIAL', 'RECEIVED')`,
          addFacilityFilter(purchaseOrders.facilityId, auth, searchParams),
        ))
        .groupBy(purchaseOrders.supplierId, equipmentSuppliers.name)

      const byMonth = await getDb()
        .select({
          month: sql<string>`to_char(${purchaseOrders.orderDate}, 'YYYY-MM')`,
          count: count(),
          totalAmount: sql<number>`coalesce(sum(${purchaseOrders.totalAmount}), 0)`,
        })
        .from(purchaseOrders)
        .where(compactAnd(
          isNull(purchaseOrders.deletedAt),
          addFacilityFilter(purchaseOrders.facilityId, auth, searchParams),
        ))
        .groupBy(sql`to_char(${purchaseOrders.orderDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${purchaseOrders.orderDate}, 'YYYY-MM')`)

      report.bySupplier = bySupplier
      report.byMonth = byMonth
    }

    return NextResponse.json(report)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/reports')
  }
}
