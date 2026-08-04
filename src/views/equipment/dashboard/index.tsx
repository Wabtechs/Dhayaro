'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Clock3,
  Package,
  PackageCheck,
  ShieldAlert,
  Stethoscope,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEquipmentDashboard } from '@/hooks/use-equipment-data'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const LazyRechartsChart = dynamic(
  () => import('@/components/charts/recharts-chart').then((m) => ({ default: m.RechartsChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
)

const CHART_COLORS = [
  '#0e384c',
  '#1e84b5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
]

interface DashboardChartPoint {
  name: string
  value: number
}

interface DashboardAlert {
  type: string
  label: string
  count: number
}

interface DashboardActivity {
  action: string
  createdAt: string
}

interface DashboardData {
  stats: Record<string, number>
  charts: Record<string, DashboardChartPoint[]>
  alerts: DashboardAlert[]
  recentActivity: DashboardActivity[]
}

interface StatCardConfig {
  key: string
  label: string
  icon: LucideIcon
  color: string
  bg: string
}

const STAT_CARDS: StatCardConfig[] = [
  { key: 'totalEquipment', label: 'Total équipements', icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'availableEquipment', label: 'Disponibles', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { key: 'inUseEquipment', label: 'En usage', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'maintenanceEquipment', label: 'En maintenance', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'outOfServiceEquipment', label: 'Hors service', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'totalMaintenance', label: 'Maintenances', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'openMaintenance', label: 'Maintenances ouvertes', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'maintenanceDueSoon', label: 'Maintenances à venir (30 j)', icon: CalendarClock, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'openIncidents', label: 'Incidents ouverts', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'resolvedIncidents', label: 'Incidents résolus', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { key: 'bookingsToday', label: 'Réservations aujourd’hui', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'pendingBookings', label: 'Réservations en attente', icon: Clock3, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'warrantiesExpiring', label: 'Garanties expirant (90 j)', icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'totalSpareParts', label: 'Pièces détachées', icon: Boxes, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'lowSpareParts', label: 'Pièces en stock faible', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  { key: 'totalSupplies', label: 'Fournitures actives', icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

const ALERT_STYLES: Record<string, string> = {
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  warranty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  incident: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  spare: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

export { EquipmentDashboardView }
export default function EquipmentDashboardView() {
  const router = useRouter()
  const { can } = usePermissions()
  const { data, isLoading } = useEquipmentDashboard()

  if (!can('equipment:view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ShieldAlert className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Accès non autorisé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous n&apos;avez pas la permission de consulter le module des équipements médicaux.
        </p>
      </div>
    )
  }

  const dashboard = data as DashboardData | undefined
  const stats = dashboard?.stats ?? {}
  const charts = dashboard?.charts ?? {}
  const alerts = dashboard?.alerts ?? []
  const recentActivity = dashboard?.recentActivity ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Équipements Médicaux</h1>
            <p className="text-sm text-muted-foreground">
              Vue d&apos;ensemble du parc d&apos;équipements et des indicateurs clés.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/equipment/items')}>
            <Activity className="mr-2 h-4 w-4" />
            Inventaire
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/equipment/categories')}>
            <Boxes className="mr-2 h-4 w-4" />
            Catégories
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-6">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-14" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon
            const value = Number(stats[stat.key] ?? 0)
            return (
              <Card key={stat.key} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <LazyRechartsChart
                type="pie"
                data={charts.equipmentByStatus ?? []}
                dataKey="value"
                title="Équipements par statut"
                height={260}
                colors={CHART_COLORS}
              />
              <LazyRechartsChart
                type="pie"
                data={charts.equipmentByState ?? []}
                dataKey="value"
                title="Équipements par état"
                height={260}
                colors={CHART_COLORS}
              />
              <LazyRechartsChart
                type="pie"
                data={charts.equipmentByType ?? []}
                dataKey="value"
                title="Équipements par type"
                height={260}
                colors={CHART_COLORS}
              />
              <LazyRechartsChart
                type="bar"
                data={charts.incidentsByPriority ?? []}
                dataKey="value"
                title="Incidents par priorité"
                height={260}
                color="#ef4444"
              />
              <LazyRechartsChart
                type="line"
                data={charts.maintenanceOverTime ?? []}
                dataKey="value"
                title="Maintenances sur 6 mois"
                height={260}
                color="#1e84b5"
              />
              <LazyRechartsChart
                type="pie"
                data={charts.bookingsByStatus ?? []}
                dataKey="value"
                title="Réservations par statut"
                height={260}
                colors={CHART_COLORS}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte active.</p>
              ) : (
                alerts.map((alert, i) => (
                  <div
                    key={`${alert.type}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                  >
                    <span className="text-sm font-medium text-foreground">{alert.label}</span>
                    <Badge className={ALERT_STYLES[alert.type] || ''}>
                      {alert.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
