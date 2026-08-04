import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import {
  medicalEquipment, equipmentMaintenance, equipmentIncidents, equipmentBookings,
  equipmentWarranties, equipmentLogs, spareParts, sparePartInventory,
  medicalSupplies,
} from '@/lib/schema'
import { eq, and, count, sql, gte, lte } from 'drizzle-orm'
import { addFacilityFilter, apiError, logError } from '@/lib/api-errors'
import { requireEquipmentPermission } from '@/lib/equipment-utils'

function compactAnd(...conditions: any[]): any {
  const valid = conditions.filter(c => c !== undefined)
  return valid.length > 0 ? and(...valid) : undefined
}

function toCount(r: Array<{ value: number }> | undefined): number {
  return (r?.[0]?.value as number) ?? 0
}

function buildMonthlyChart(items: Array<{ createdAt?: Date | string | null }>) {
  const now = new Date()
  const map = new Map<string, { label: string; value: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    map.set(`${d.getFullYear()}-${d.getMonth()}`, { label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, value: 0 })
  }
  const keys = [...map.keys()]
  items.forEach(item => {
    const d = item.createdAt ? new Date(item.createdAt) : null
    if (d && !isNaN(d.getTime())) {
      const k = `${d.getFullYear()}-${d.getMonth()}`
      const entry = map.get(k) || { label: k, value: 0 }
      entry.value += 1
      map.set(k, entry)
    }
  })
  return keys.map(k => ({ name: map.get(k)!.label, value: map.get(k)!.value }))
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const today = new Date()

    const [
      equipmentTotal,
      equipmentByStatus,
      equipmentByState,
      equipmentByType,
      maintenanceTotal,
      maintenanceOpen,
      maintenanceDueSoon,
      incidentsOpen,
      incidentsByPriority,
      incidentsResolved,
      bookingsToday,
      bookingsPending,
      warrantiesExpiring,
      logsRecent,
      spareTotal,
      spareLow,
      stockAlerts,
    ] = await Promise.all([
      getDb().select({ value: count() }).from(medicalEquipment)
        .where(compactAnd(addFacilityFilter(medicalEquipment.facilityId, auth, searchParams))),
      getDb().select({ status: medicalEquipment.status, value: count() }).from(medicalEquipment)
        .where(compactAnd(addFacilityFilter(medicalEquipment.facilityId, auth, searchParams)))
        .groupBy(medicalEquipment.status),
      getDb().select({ state: medicalEquipment.state, value: count() }).from(medicalEquipment)
        .where(compactAnd(addFacilityFilter(medicalEquipment.facilityId, auth, searchParams)))
        .groupBy(medicalEquipment.state),
      getDb().select({ type: medicalEquipment.type, value: count() }).from(medicalEquipment)
        .where(compactAnd(addFacilityFilter(medicalEquipment.facilityId, auth, searchParams)))
        .groupBy(medicalEquipment.type),
      getDb().select({ value: count() }).from(equipmentMaintenance)
        .where(compactAnd(addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams))),
      getDb().select({ value: count() }).from(equipmentMaintenance)
        .where(compactAnd(
          sql`${equipmentMaintenance.status} in ('SCHEDULED', 'IN_PROGRESS')`,
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(equipmentMaintenance)
        .where(compactAnd(
          sql`${equipmentMaintenance.scheduledDate} is not null and ${equipmentMaintenance.scheduledDate} <= current_date + 30 and ${equipmentMaintenance.status} in ('SCHEDULED')`,
          addFacilityFilter(equipmentMaintenance.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(equipmentIncidents)
        .where(compactAnd(
          sql`${equipmentIncidents.status} in ('OPEN', 'IN_PROGRESS')`,
          addFacilityFilter(equipmentIncidents.facilityId, auth, searchParams),
        )),
      getDb().select({ priority: equipmentIncidents.priority, value: count() }).from(equipmentIncidents)
        .where(compactAnd(addFacilityFilter(equipmentIncidents.facilityId, auth, searchParams)))
        .groupBy(equipmentIncidents.priority),
      getDb().select({ value: count() }).from(equipmentIncidents)
        .where(compactAnd(
          eq(equipmentIncidents.status, 'RESOLVED'),
          addFacilityFilter(equipmentIncidents.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(equipmentBookings)
        .where(compactAnd(
          gte(equipmentBookings.startTime, new Date(today.setHours(0, 0, 0, 0))),
          lte(equipmentBookings.startTime, new Date(today.setHours(23, 59, 59, 999))),
          addFacilityFilter(equipmentBookings.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(equipmentBookings)
        .where(compactAnd(
          eq(equipmentBookings.status, 'PENDING'),
          addFacilityFilter(equipmentBookings.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(equipmentWarranties)
        .where(compactAnd(
          sql`${equipmentWarranties.endDate} >= current_date and ${equipmentWarranties.endDate} <= current_date + 90`,
          addFacilityFilter(equipmentWarranties.facilityId, auth, searchParams),
        )),
      getDb().select({ action: equipmentLogs.action, createdAt: equipmentLogs.createdAt })
        .from(equipmentLogs)
        .where(compactAnd(addFacilityFilter(equipmentLogs.facilityId, auth, searchParams)))
        .orderBy(equipmentLogs.createdAt),
      getDb().select({ value: count() }).from(spareParts)
        .where(compactAnd(addFacilityFilter(spareParts.facilityId, auth, searchParams))),
      getDb().select({ value: count() }).from(sparePartInventory)
        .where(compactAnd(
          sql`${sparePartInventory.quantity} <= ${sparePartInventory.minStock}`,
          addFacilityFilter(sparePartInventory.facilityId, auth, searchParams),
        )),
      getDb().select({ value: count() }).from(medicalSupplies)
        .where(compactAnd(addFacilityFilter(medicalSupplies.facilityId, auth, searchParams), eq(medicalSupplies.isActive, true))),
    ])

    const statusLabels: Record<string, string> = {
      AVAILABLE: 'Disponible', IN_USE: 'En usage', MAINTENANCE: 'En maintenance',
      OUT_OF_SERVICE: 'Hors service', RETIRED: 'Retiré',
    }
    const stateLabels: Record<string, string> = {
      NEW: 'Neuf', GOOD: 'Bon', FAIR: 'Moyen', POOR: 'Mauvais',
      CRITICAL: 'Critique', DISPOSED: 'Éliminé',
    }
    const priorityLabels: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Élevée', URGENT: 'Urgente' }

    const equipmentByStatusChart = (equipmentByStatus as Array<{ status: string; value: number }>).map(i => ({
      name: statusLabels[i.status] || i.status,
      value: i.value,
    }))
    const equipmentByStateChart = (equipmentByState as Array<{ state: string; value: number }>).map(i => ({
      name: stateLabels[i.state] || i.state,
      value: i.value,
    }))
    const equipmentByTypeChart = (equipmentByType as Array<{ type: string; value: number }>).map(i => ({
      name: i.type,
      value: i.value,
    }))
    const incidentsByPriorityChart = (incidentsByPriority as Array<{ priority: string; value: number }>).map(i => ({
      name: priorityLabels[i.priority] || i.priority,
      value: i.value,
    }))

    const recentActivity = (logsRecent as Array<{ action: string; createdAt: Date | string }>).slice(-10).reverse().map(l => ({
      action: l.action,
      createdAt: l.createdAt,
    }))

    const stats = {
      totalEquipment: toCount(equipmentTotal),
      availableEquipment: (equipmentByStatus as Array<{ status: string; value: number }>).find(i => i.status === 'AVAILABLE')?.value ?? 0,
      inUseEquipment: (equipmentByStatus as Array<{ status: string; value: number }>).find(i => i.status === 'IN_USE')?.value ?? 0,
      maintenanceEquipment: (equipmentByStatus as Array<{ status: string; value: number }>).find(i => i.status === 'MAINTENANCE')?.value ?? 0,
      outOfServiceEquipment: (equipmentByStatus as Array<{ status: string; value: number }>).find(i => i.status === 'OUT_OF_SERVICE')?.value ?? 0,
      totalMaintenance: toCount(maintenanceTotal),
      openMaintenance: toCount(maintenanceOpen),
      maintenanceDueSoon: toCount(maintenanceDueSoon),
      openIncidents: toCount(incidentsOpen),
      resolvedIncidents: toCount(incidentsResolved),
      bookingsToday: toCount(bookingsToday),
      pendingBookings: toCount(bookingsPending),
      warrantiesExpiring: toCount(warrantiesExpiring),
      totalSpareParts: toCount(spareTotal),
      lowSpareParts: toCount(spareLow),
      totalSupplies: toCount(stockAlerts),
    }

    const charts = {
      equipmentByStatus: equipmentByStatusChart,
      equipmentByState: equipmentByStateChart,
      equipmentByType: equipmentByTypeChart,
      incidentsByPriority: incidentsByPriorityChart,
      maintenanceOverTime: buildMonthlyChart(logsRecent as Array<{ createdAt?: Date | string }>),
      bookingsByStatus: [{ name: 'Aujourd\u2019hui', value: stats.bookingsToday }],
    }

    const alerts = [
      { type: 'maintenance', label: 'Maintenances à venir (30 j)', count: stats.maintenanceDueSoon },
      { type: 'warranty', label: 'Garanties expirant (90 j)', count: stats.warrantiesExpiring },
      { type: 'incident', label: 'Incidents ouverts', count: stats.openIncidents },
      { type: 'spare', label: 'Pièces détachées en stock faible', count: stats.lowSpareParts },
    ].filter(a => a.count > 0)

    return NextResponse.json({ stats, charts, alerts, recentActivity })
  } catch (e) {
    logError('GET /equipment/dashboard', e)
    return apiError(500, 'Internal server error')
  }
}
