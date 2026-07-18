'use client'

import { useState, useMemo } from 'react'
import { Archive, Search } from 'lucide-react'
import { useArchivesData } from '@/hooks/use-data'
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

const typeLabels: Record<string, string> = {
  PATIENT: 'Patient',
  CLINICAL_CASE: 'Cas clinique',
  CONSULTATION: 'Consultation',
  TREATMENT: 'Traitement',
  LAB_EXAM: 'Examen labo',
  DOCUMENT: 'Document',
}

const typeColors: Record<string, string> = {
  PATIENT: 'bg-blue-100 text-blue-800',
  CLINICAL_CASE: 'bg-purple-100 text-purple-800',
  CONSULTATION: 'bg-green-100 text-green-800',
  TREATMENT: 'bg-orange-100 text-orange-800',
  LAB_EXAM: 'bg-cyan-100 text-cyan-800',
  DOCUMENT: 'bg-gray-100 text-gray-700',
}

export { ArchivesView }
export default function ArchivesView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useArchivesData(search ? `search=${search}` : '')
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.type || '').toLowerCase().includes(q) ||
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.archivedBy || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Archives</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} élément{filtered.length > 1 ? 's' : ''} archivé{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les archives..."
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune archive disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Archivé par</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => {
                    const type = String(item.type || '').toUpperCase()
                    return (
                      <TableRow key={item.id as string}>
                        <TableCell>
                          <Badge className={typeColors[type] || 'bg-gray-100 text-gray-700'}>
                            {typeLabels[type] || String(item.type || '—')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.title || '—')}
                        </TableCell>
                        <TableCell>
                          {String(item.patient || item.patientName || '—')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(item.archivedBy || '—')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(String(item.archivedAt || item.createdAt || ''))}
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
