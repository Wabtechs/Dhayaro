import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Download,
  Shield,
  Eye,
  Plus,
  Edit,
  Trash2,
  LogIn,
  Calendar,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  AlignJustify,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuditData, useUsersData } from '@/hooks/use-data'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { AuditEntry } from '@/types'

interface AuditItem {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  details: string
  ipAddress: string
  timestamp: string
  facilityId?: string
  userFirstname?: string
  userLastname?: string
  userEmail?: string
  [key: string]: unknown
}

interface UserItem {
  id: string
  name?: string
  avatar?: string
  [key: string]: unknown
}

type ActionCategory = 'consultation' | 'creation' | 'modification' | 'suppression' | 'connexion'

const PAGE_SIZE = 15

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'creation', label: 'Création' },
  { value: 'modification', label: 'Modification' },
  { value: 'suppression', label: 'Suppression' },
  { value: 'connexion', label: 'Connexion' },
]

function getActionCategory(action: string): ActionCategory {
  const lower = action.toLowerCase()
  if (lower.includes('connexion')) return 'connexion'
  if (
    lower.includes('création') ||
    lower.includes('creation') ||
    lower.includes('ajout')
  )
    return 'creation'
  if (lower.includes('suppression') || lower.includes('supprimer'))
    return 'suppression'
  if (
    lower.includes('modification') ||
    lower.includes('changement') ||
    lower.includes('gestion') ||
    lower.includes('mise à jour')
  )
    return 'modification'
  return 'consultation'
}

const actionConfig: Record<
  ActionCategory,
  { icon: typeof Eye; color: string; bg: string; label: string }
> = {
  consultation: {
    icon: Eye,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Consultation',
  },
  creation: {
    icon: Plus,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Création',
  },
  modification: {
    icon: Edit,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Modification',
  },
  suppression: {
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Suppression',
  },
  connexion: {
    icon: LogIn,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Connexion',
  },
}

function getDateString(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function AuditLogPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

  const { data, isLoading } = useAuditData()
  const { data: usersData } = useUsersData()
  const auditEntries = ((data?.items ?? []) as AuditItem[])
  const users = ((usersData as unknown as { items?: UserItem[] })?.items ?? [])
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const filtered = useMemo(() => {
    return auditEntries.filter((entry) => {
      const user = userMap[entry.userId]
      const matchesSearch =
        (entry.details || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.entity || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.entityId || '').toLowerCase().includes(search.toLowerCase()) ||
        (user?.name.toLowerCase().includes(search.toLowerCase()) ?? false)

      const category = getActionCategory(entry.action)
      const matchesAction =
        actionFilter === 'all' || category === actionFilter

      const matchesUser =
        userFilter === 'all' || entry.userId === userFilter

      const entryDate = new Date(entry.timestamp)
      const matchesFrom = !dateFrom || entryDate >= new Date(dateFrom)
      const matchesTo =
        !dateTo || entryDate <= new Date(dateTo + 'T23:59:59Z')

      return matchesSearch && matchesAction && matchesUser && matchesFrom && matchesTo
    })
  }, [auditEntries, search, actionFilter, userFilter, dateFrom, dateTo, userMap])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const uniqueUsers = useMemo(
    () => new Set(filtered.map((e) => e.userId)).size,
    [filtered]
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const actionsToday = useMemo(
    () =>
      filtered.filter((e) => e.timestamp.startsWith(todayStr)).length,
    [filtered, todayStr]
  )

  const groupedByDate = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {}
    for (const entry of filtered) {
      const key = getDateString(entry.timestamp)
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
    }
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Journal d'Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des actions et événements de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Tableau
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              <AlignJustify className="h-3.5 w-3.5" />
              Chronologie
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Export en cours", description: "Le journal d'audit sera exporté en CSV" })}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement du journal d'audit...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Entrées
                  </p>
                  <p className="text-xl font-bold">{filtered.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Utilisateurs Uniques
                  </p>
                  <p className="text-xl font-bold">{uniqueUsers}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Actions Aujourd'hui
                  </p>
                  <p className="text-xl font-bold">{actionsToday}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans le journal..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={userFilter}
              onValueChange={(v) => {
                setUserFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id as string} value={u.id as string}>
                    {(u.name as string) || `${u.firstname} ${u.lastname}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="w-[150px]"
                  placeholder="Du"
                />
              </div>
              <span className="text-sm text-muted-foreground">à</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="w-[150px]"
                placeholder="Au"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Aucun résultat</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aucune entrée ne correspond à vos critères de recherche.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>ID Entité</TableHead>
                      <TableHead className="min-w-[200px]">Détails</TableHead>
                      <TableHead>Adresse IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((entry) => {
                      const category = getActionCategory(entry.action)
                      const config = actionConfig[category]
                      const Icon = config.icon
                      const user = userMap[entry.userId]

                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(entry.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-[10px]">
                                  {user ? getInitials(user.name) : '??'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="whitespace-nowrap text-sm font-medium">
                                {user?.name ?? 'Inconnu'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}
                            >
                              <Icon className="h-3 w-3" />
                              {entry.action}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{entry.entity || '—'}</TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                              {entry.entityId || '—'}
                            </code>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {entry.details || '—'}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground">
                              {entry.ipAddress || '—'}
                            </code>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} entrée{filtered.length > 1 ? 's' : ''} au total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {groupedByDate.map(([date, entries]) => (
                <div key={date}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">{date}</h3>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {entries.length} action{entries.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="relative ml-4 border-l-2 border-muted pl-6">
                    {entries.map((entry) => {
                      const category = getActionCategory(entry.action)
                      const config = actionConfig[category]
                      const Icon = config.icon
                      const user = userMap[entry.userId]

                      return (
                        <div key={entry.id} className="relative mb-6 last:mb-0">
                          <div
                            className={`absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background ${config.bg}`}
                          >
                            <Icon className={`h-3 w-3 ${config.color}`} />
                          </div>
                          <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="text-[9px]">
                                    {user ? getInitials(user.name) : '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {user?.name ?? 'Inconnu'}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}
                                >
                                  <Icon className="h-2.5 w-2.5" />
                                  {config.label}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(entry.timestamp)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {entry.details || '—'}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {entry.entity || '—'}{' '}
                                <code className="rounded bg-muted px-1 py-0.5">
                                  {entry.entityId || '—'}
                                </code>
                              </span>
                              <span>•</span>
                              <code>{entry.ipAddress}</code>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
