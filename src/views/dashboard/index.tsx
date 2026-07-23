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
  Users,
  Activity,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDashboardData } from '@/hooks/use-data'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/lib/permissions'

const LazyRechartsChart = dynamic(
  () => import('@/components/charts/recharts-chart').then(m => ({ default: m.RechartsChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
)
import { formatDate, formatNumber } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En revue',
  resolved: 'Résolu',
  archived: 'Archivé',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Elevée',
  critical: 'Critique',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData()
  const user = useAuthStore(s => s.user)

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

  const { stats, recentCases, chartData, patientMap, facilityMap } = data
  const activeFacilityId = typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null
  const userName = user?.name?.split(' ').slice(-1)[0] || user?.name || 'Docteur'
  const roleLabel = user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : ''
  const activeFacilityName = activeFacilityId ? facilityMap[activeFacilityId] : null

  const statsCards = [
    {
      title: 'Consultations',
      value: formatNumber(stats.total_cases),
      icon: Stethoscope,
      color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      href: '/consultations',
    },
    {
      title: 'Patients',
      value: formatNumber(stats.total_patients),
      icon: UserRound,
      color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      href: '/patients',
    },
    {
      title: 'Établissements',
      value: formatNumber(stats.total_facilities),
      icon: Building2,
      color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
      href: '/facilities',
    },
    {
      title: 'Taux de Résolution',
      value: `${stats.resolution_rate}%`,
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
      href: '/reports',
    },
  ]

  const quickActions = [
    { label: 'File d\'attente', icon: ListOrdered, href: '/queue', color: 'text-orange-500' },
    { label: 'Consultations', icon: Stethoscope, href: '/consultations', color: 'text-blue-500' },
    { label: 'Documents', icon: FileText, href: '/documents', color: 'text-purple-500' },
    { label: 'Utilisateurs', icon: Users, href: '/users', color: 'text-emerald-500' },
  ]

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
            {activeFacilityName ? `Établissement: ${activeFacilityName}` : 'Tous les établissements'}
            {' — '}
            Voici un aperçu de votre tableau de bord Dhayaro.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span>Système opérationnel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LazyRechartsChart
          type="area"
          data={chartData.casesByMonth}
          dataKey="value"
          xAxisKey="name"
          title="Consultations par Mois"
          description="Evolution mensuelle des consultations"
          height={300}
        />
        <LazyRechartsChart
          type="pie"
          data={chartData.casesByStatus}
          dataKey="value"
          xAxisKey="name"
          title="Repartition par Statut"
          description="Distribution des cas selon leur statut"
          height={300}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activite Recente</CardTitle>
          <Link href="/consultations">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultation</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Etablissement</TableHead>
                <TableHead>Priorite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucune activite recente.
                  </TableCell>
                </TableRow>
              ) : (
                recentCases.map((cas) => {
                  const patientName = patientMap[cas.patientId] || '—'
                  const facilityName = facilityMap[cas.facilityId] || '—'
                  return (
                    <TableRow key={cas.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/clinical-cases/${cas.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {cas.title || cas.diagnosis || 'Sans titre'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patientName}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-muted-foreground">
                        {facilityName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${PRIORITY_COLORS[cas.priority] || ''} border-0 font-medium`}>
                          {PRIORITY_LABELS[cas.priority] || cas.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${STATUS_COLORS[cas.status] || ''} border-0 font-medium`}>
                          {STATUS_LABELS[cas.status] || cas.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(cas.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
