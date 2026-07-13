import { Link } from 'react-router-dom'
import {
  FolderOpen,
  UserRound,
  Building2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RechartsChart } from '@/components/charts/recharts-chart'
import { useDashboardData } from '@/hooks/use-data'
import { formatDate, formatNumber } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En revue',
  resolved: 'Résolu',
  archived: 'Archivé',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  in_review: 'secondary',
  resolved: 'default',
  archived: 'outline',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 18) return 'Bonjour'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData()

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Chargement du tableau de bord…</p>
      </div>
    )
  }

  const { stats, recentCases, chartData, patientMap, facilityMap } = data

  const statsCards = [
    {
      title: 'Total Cas Cliniques',
      value: formatNumber(stats.total_cases),
      change: '+12%',
      changeType: 'increase' as const,
      icon: FolderOpen,
    },
    {
      title: 'Patients Actifs',
      value: formatNumber(stats.total_patients),
      change: '+5%',
      changeType: 'increase' as const,
      icon: UserRound,
    },
    {
      title: 'Établissements',
      value: formatNumber(stats.total_facilities),
      change: '+2%',
      changeType: 'increase' as const,
      icon: Building2,
    },
    {
      title: 'Taux de Résolution',
      value: `${stats.resolution_rate}%`,
      change: '+3%',
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, Docteur
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre tableau de bord MedInsight.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        stat.changeType === 'increase'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.changeType === 'increase' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RechartsChart
          type="area"
          data={chartData.casesByMonth}
          dataKey="value"
          xAxisKey="name"
          title="Cas par Mois"
          description="Évolution mensuelle des cas cliniques"
          height={300}
        />
        <RechartsChart
          type="pie"
          data={chartData.casesByStatus}
          dataKey="value"
          xAxisKey="name"
          title="Répartition par Statut"
          description="Distribution des cas selon leur statut"
          height={300}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cas Cliniques Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCases.map((cas) => {
                const patientName = patientMap[cas.patientId] || '—'
                const facilityName = facilityMap[cas.facilityId] || '—'
                return (
                  <TableRow key={cas.id}>
                    <TableCell>
                      <Link
                        to={`/cases/${cas.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {cas.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {facilityName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cas.priority === 'critical' ? 'destructive' : 'outline'}>
                        {cas.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[cas.status] ?? 'outline'}>
                        {STATUS_LABELS[cas.status] ?? cas.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cas.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
