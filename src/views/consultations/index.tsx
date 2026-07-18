'use client'

import { useState, useMemo } from 'react'
import { Stethoscope, Search } from 'lucide-react'
import { useConsultationsData } from '@/hooks/use-data'
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
  WAITING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Termine', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annule', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export { ConsultationsView }
export default function ConsultationsView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useConsultationsData(search ? `search=${search}` : '')
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.doctor || '').toLowerCase().includes(q) ||
        String(item.motif || '').toLowerCase().includes(q) ||
        String(item.consultationNumber || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Stethoscope className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultations</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} consultation{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une consultation..."
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune consultation disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Consultation</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => {
                    const status = String(item.status || '').toUpperCase()
                    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <TableRow key={item.id as string}>
                        <TableCell className="font-mono text-sm">
                          {String(item.consultationNumber || item.id || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.patient || item.patientName || '—')}
                        </TableCell>
                        <TableCell>{String(item.doctor || item.doctorName || '—')}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {String(item.motif || item.reason || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt as string)}
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
