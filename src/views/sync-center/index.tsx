import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useSyncData } from '@/hooks/use-data'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { formatDateTime, shortRef } from '@/lib/utils'
import type { SyncLog } from '@/types'

const entityLabels: Record<string, string> = {
  ClinicalCase: 'Cas',
  Patient: 'Patient',
  AuditEntry: 'Journal',
  User: 'Utilisateur',
  Facility: 'Établissement',
}

const actionLabels: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
}

const actionBadgeClass: Record<string, string> = {
  create: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  update: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  delete: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: <Clock className="h-3 w-3" />,
  },
  synced: {
    label: 'Réussi',
    color: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  failed: {
    label: 'Échoué',
    color: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: <XCircle className="h-3 w-3" />,
  },
}

function SyncTable({ logs, onRetry }: { logs: SyncLog[]; onRetry: (id: string) => void }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <CheckCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Aucune synchronisation dans cette catégorie.</p>
      </div>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type d'entité</TableHead>
            <TableHead className="hidden md:table-cell">ID Entité</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden lg:table-cell">Horodatage</TableHead>
            <TableHead className="hidden xl:table-cell">Message d'erreur</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => {
            const sc = statusConfig[log.status]
            return (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{index + 1}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{entityLabels[log.entityType] || log.entityType}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  <span title={log.entityId}>{shortRef(log.entityId)}</span>
                </TableCell>
                <TableCell>
                  <Badge className={actionBadgeClass[log.action]}>{actionLabels[log.action]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={sc.color}>
                    <span className="mr-1 flex items-center gap-1">{sc.icon}</span>
                    {sc.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {log.errorMessage && (
                    <div className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{log.errorMessage}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {log.status === 'failed' && (
                    <Button variant="ghost" size="sm" onClick={() => onRetry(log.id)}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Réessayer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

const SIZE = 10

export default function SyncCenterPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [autoSync, setAutoSync] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const statusParam = tab === 'all' ? '' : tab
  const { data: syncData, isLoading } = useSyncData(page, SIZE, statusParam)

  const syncItems = (syncData?.items as SyncLog[]) || []
  const total = syncData?.total ?? 0
  const pendingCount = syncData?.pendingCount ?? 0
  const syncedCount = syncData?.syncedCount ?? 0
  const failedCount = syncData?.failedCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  const lastSyncItem = syncItems.length > 0
    ? syncItems.reduce((latest, l) => new Date(l.timestamp) > new Date(latest.timestamp) ? l : latest, syncItems[0])
    : null

  const syncProgress = (pendingCount + syncedCount + failedCount) > 0
    ? Math.round((syncedCount / (pendingCount + syncedCount + failedCount)) * 100)
    : 0

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setTab(value)
    setPage(1)
  }, [])

  const doSync = async (ids: string[]) => {
    setIsSyncing(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/sync/push', { ids }, token)
      await queryClient.invalidateQueries({ queryKey: ['sync'] })
      toast({ title: 'Synchronisation réussie', description: 'Les données ont été synchronisées.' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de synchroniser les données.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncNow = () => {
    const pendingIds = syncItems.filter((l) => l.status === 'pending').map((l) => l.id)
    if (pendingIds.length === 0) {
      toast({ title: 'Rien à synchroniser', description: 'Toutes les données sont à jour.' })
      return
    }
    doSync(pendingIds)
  }

  const handleSyncAll = () => {
    const allPending = pendingCount
    if (allPending === 0) {
      toast({ title: 'Rien à synchroniser', description: 'Toutes les données sont à jour.' })
      return
    }
    doSync(syncItems.filter((l) => l.status === 'pending').map((l) => l.id))
  }

  const handleRetry = async (id: string) => {
    doSync([id])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-9 w-44 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="flex items-center gap-3 p-4"><Skeleton className="h-5 w-5 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-5 w-8" /></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Skeleton className="h-5 w-5 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-8" /></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Skeleton className="h-5 w-5 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-8" /></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Skeleton className="h-5 w-5 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-8" /></div></CardContent></Card>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <Card>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Centre de Synchronisation
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez la synchronisation des données hors ligne et en ligne.
        </p>
      </div>

      <Card className={isOnline ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'}>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {isOnline ? <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" /> : <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <h3 className="text-lg font-semibold text-foreground">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </h3>
              </div>
              {lastSyncItem && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Dernière sync : {formatDateTime(lastSyncItem.timestamp)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sync automatique</span>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            <div className="flex items-center gap-2">
              {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <Button onClick={handleSyncNow} disabled={isSyncing} size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Synchroniser maintenant
              </Button>
              <Button onClick={handleSyncAll} disabled={isSyncing} variant="outline" size="sm">
                Tout synchroniser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Progression de la synchronisation</h3>
          <span className="text-sm font-semibold text-foreground">{syncProgress}%</span>
        </div>
        <Progress value={syncProgress} className="h-2.5" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{pendingCount + syncedCount + failedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Réussies</p>
              <p className="text-xl font-bold text-green-600">{syncedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Échouées</p>
              <p className="text-xl font-bold text-red-600">{failedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Tous ({pendingCount + syncedCount + failedCount})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          <TabsTrigger value="synced">Réussies ({syncedCount})</TabsTrigger>
          <TabsTrigger value="failed">Échouées ({failedCount})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <SyncTable logs={syncItems} onRetry={handleRetry} />
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} éléments)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
