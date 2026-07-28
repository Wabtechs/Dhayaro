'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Stethoscope,
  UserRound,
  Building2,
  TrendingUp,
  ListOrdered,
  FileText,
  Activity,
  ArrowRight,
  Users,
  Brain,
  TestTubes,
  Pill,
  Clock,
  Loader,
  CheckCircle,
  ShieldCheck,
  ClipboardList,
  BedDouble,
  Package,
  Archive,
  BarChart3,
  Settings,
  Shield,
  Bell,
  UserPlus,
  FolderOpen,
  FileCheck,
  Lightbulb,
  BookMarked,
  BookOpen,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRoleDashboardData } from '@/hooks/use-data'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/lib/permissions'
import { getDashboardConfig } from '@/lib/dashboard-config'
import type { UserRole } from '@/types'

const LazyRechartsChart = dynamic(
  () => import('@/components/charts/recharts-chart').then(m => ({ default: m.RechartsChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
)
import { formatNumber } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  UserRound,
  Building2,
  TrendingUp,
  ListOrdered,
  FileText,
  Users,
  Brain,
  TestTubes,
  Pill,
  Clock,
  Loader,
  CheckCircle,
  ShieldCheck,
  ClipboardList,
  BedDouble,
  Package,
  Archive,
  BarChart3,
  Settings,
  Shield,
  Bell,
  UserPlus,
  FolderOpen,
  FileCheck,
  Lightbulb,
  BookMarked,
  BookOpen,
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const userRole = (user?.role || 'admin') as UserRole
  const { data, isLoading } = useRoleDashboardData(userRole)

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Chargement du tableau de bord…
        </div>
      </div>
    )
  }

  const config = getDashboardConfig(userRole)
  const { stats, charts } = data

  const userName = user?.name?.split(' ').slice(-1)[0] || user?.name || 'Utilisateur'
  const roleLabel = user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : ''
  const activeFacilityId = typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {roleLabel && <span className="font-medium">{roleLabel}</span>}
            {roleLabel && ' — '}
            {activeFacilityId ? 'Établissement assigné' : (userRole === 'super_admin' ? 'Tous les établissements' : 'Tableau de bord personnel')}
            {' — '}
            Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span>Système opérationnel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {config.statsCards.map((stat) => {
          const Icon = ICON_MAP[stat.iconName] || Activity
          const value = stat.key === 'resolution'
            ? `${stats[stat.statKey] ?? 0}%`
            : formatNumber(stats[stat.statKey] ?? 0)
          return (
            <Link key={stat.key} href={stat.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {config.quickActions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
          {config.quickActions.map((action) => {
            const Icon = ICON_MAP[action.iconName] || Activity
            return (
              <Link key={action.label} href={action.href}>
                <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {config.charts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {config.charts.map((chart) => {
            const chartData = charts[chart.dataKey] || []
            return (
              <LazyRechartsChart
                key={chart.dataKey}
                type={chart.type}
                data={chartData}
                dataKey="value"
                xAxisKey="name"
                title={chart.title}
                description={chart.description}
                height={300}
              />
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{config.recentActivityTitle}</CardTitle>
          <Link href={config.recentActivityLink}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              {config.recentActivityLinkLabel} <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Les données d&apos;activité seront affichées ici.</p>
            <p className="text-xs mt-1">
              {config.activityColumns.map(c => c.label).join(' · ')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
