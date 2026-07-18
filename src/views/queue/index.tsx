'use client'

import { useState, useMemo } from 'react'
import { ListOrdered, Search, Clock } from 'lucide-react'
import { useQueueData } from '@/hooks/use-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  WAITING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
}

export { QueueView }
export default function QueueView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQueueData(search ? `search=${search}` : '')
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.ticketNumber || '').toLowerCase().includes(q) ||
        String(item.patientName || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ListOrdered className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File d&apos;attente</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''} dans la file
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient ou ticket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune entrée dans la file d&apos;attente</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item: Record<string, unknown>) => {
                const priority = String(item.priority || '').toUpperCase()
                const status = String(item.status || '').toUpperCase()
                const pConfig = priorityConfig[priority] || { label: priority || '—', color: 'bg-gray-100 text-gray-700' }
                const sConfig = statusConfig[status] || { label: status || '—', color: 'bg-gray-100 text-gray-700' }
                return (
                  <Card key={item.id as string} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg font-bold text-primary">
                          {String(item.ticketNumber || `#${Number(item.position || 0)}`)}
                        </span>
                        <Badge className={sConfig.color}>{sConfig.label}</Badge>
                      </div>
                      <div>
                        <p className="font-medium truncate">
                          {String(item.patient || item.patientName || '—')}
                        </p>
                        {item.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {String(item.reason)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={pConfig.color}>{pConfig.label}</Badge>
                        {item.position && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Position {String(item.position)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt as string)}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
