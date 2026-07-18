'use client'

import { useState, useMemo } from 'react'
import { Bug, Search } from 'lucide-react'
import { useDiseasesData } from '@/hooks/use-data'
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

const severityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700' },
  MODERATE: { label: 'Modérée', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critique', color: 'bg-red-100 text-red-800' },
}

export { DiseasesView }
export default function DiseasesView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDiseasesData(search ? `search=${search}` : '')
  const items = data?.items || []

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.code || '').toLowerCase().includes(q) ||
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maladies (CIM-10)</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} maladie{filtered.length > 1 ? 's' : ''} référencée{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou nom..."
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune maladie disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Contagieux</TableHead>
                    <TableHead>Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => {
                    const severity = String(item.severity || '').toUpperCase()
                    const config = severityConfig[severity] || { label: severity || '—', color: 'bg-gray-100 text-gray-700' }
                    return (
                      <TableRow key={item.id as string}>
                        <TableCell className="font-mono text-sm font-medium">
                          {String(item.code || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.name || '—')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(item.category || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.contagious
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-600'
                            }
                          >
                            {item.contagious ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isActive !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }
                          >
                            {item.isActive !== false ? 'Actif' : 'Inactif'}
                          </Badge>
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
