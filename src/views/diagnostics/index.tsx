'use client'

import { useState, useMemo } from 'react'
import { Brain, Search } from 'lucide-react'
import { useDiagnosticsData } from '@/hooks/use-data'
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

export { DiagnosticsView }
export default function DiagnosticsView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDiagnosticsData(search ? `search=${search}` : '')
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.type || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q) ||
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.doctor || '').toLowerCase().includes(q) ||
        String(item.disease || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diagnostics</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} diagnostic{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un diagnostic..."
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun diagnostic disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Maladie</TableHead>
                    <TableHead>Validé</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => (
                    <TableRow key={item.id as string}>
                      <TableCell>
                        <Badge variant="outline">{String(item.type || '—')}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm">
                        {String(item.description || item.diagnosis || '—')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(item.patient || item.patientName || '—')}
                      </TableCell>
                      <TableCell>{String(item.doctor || item.doctorName || '—')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {String(item.disease || item.diseaseName || '—')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.validated || item.isValidated
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {item.validated || item.isValidated ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt as string)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
