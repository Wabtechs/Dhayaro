import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useSyncData } from '@/hooks/use-data'
import { formatDateTime } from '@/lib/utils'
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
          {logs.map((log) => {
            const sc = statusConfig[log.status]
            return (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{entityLabels[log.entityType] || log.entityType}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{log.entityId}</TableCell>
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

export default function SyncCenterPage() {
  const [isOnline] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { data: syncData } = useSyncData()
  const [logs, setLogs] = useState<SyncLog[]>((syncData?.items as SyncLog[]) || [])

  useEffect(() => {
    if (syncData?.items) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs server state to local mutable state for optimistic UI
      setLogs(syncData.items as SyncLog[])
    }
  }, [syncData])

  const lastSync = logs.length > 0
    ? logs.reduce((latest, l) => new Date(l.timestamp) > new Date(latest.timestamp) ? l : latest, logs[0])
    : null

  const pendingCount = logs.filter((l) => l.status === 'pending').length
  const syncedCount = logs.filter((l) => l.status === 'synced').length
  const failedCount = logs.filter((l) => l.status === 'failed').length
  const total = logs.length
  const syncProgress = total > 0 ? Math.round((syncedCount / total) * 100) : 0

  const handleSyncNow = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 2000)
  }

  const handleSyncAll = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 3000)
  }

  const handleRetry = (id: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'synced' as const, errorMessage: undefined } : l))
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
              {lastSync && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Dernière sync : {formatDateTime(lastSync.timestamp)}
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
              <p className="text-xl font-bold text-foreground">{total}</p>
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({total})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          <TabsTrigger value="synced">Réussies ({syncedCount})</TabsTrigger>
          <TabsTrigger value="failed">Échouées ({failedCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <SyncTable logs={logs} onRetry={handleRetry} />
        </TabsContent>
        <TabsContent value="pending">
          <SyncTable logs={logs.filter((l) => l.status === 'pending')} onRetry={handleRetry} />
        </TabsContent>
        <TabsContent value="synced">
          <SyncTable logs={logs.filter((l) => l.status === 'synced')} onRetry={handleRetry} />
        </TabsContent>
        <TabsContent value="failed">
          <SyncTable logs={logs.filter((l) => l.status === 'failed')} onRetry={handleRetry} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
