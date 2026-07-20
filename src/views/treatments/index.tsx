'use client'

import { useState, useMemo } from 'react'
import { Pill, Search } from 'lucide-react'
import { useTreatmentsListData } from '@/hooks/use-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
  PAUSED: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
}

export { TreatmentsView }
export default function TreatmentsView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useTreatmentsListData(search ? `search=${search}` : '')
  const filtered = useMemo(() => {
    const items = data?.items ?? []
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.description || '').toLowerCase().includes(q) ||
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.doctor || '').toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pill className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traitements</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} traitement{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un traitement..."
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun traitement disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => {
                    const status = String(item.status || '').toUpperCase()
                    const config = statusConfig[status] || { label: status || '—', color: 'bg-gray-100 text-gray-700' }
                    return (
                      <TableRow key={item.id as string}>
                        <TableCell className="max-w-[240px] truncate font-medium">
                          {String(item.description || item.treatment || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.patient || item.patientName || '—')}
                        </TableCell>
                        <TableCell>{String(item.doctor || item.doctorName || '—')}</TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.startDate as string)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.endDate as string)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
