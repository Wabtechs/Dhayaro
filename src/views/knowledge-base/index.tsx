'use client'

import { useState } from 'react'
import { Search, BookOpen, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useClinicalKnowledgeBaseData, useDiseasesData } from '@/hooks/use-data'
import { formatDate } from '@/lib/utils'

interface KnowledgeEntry {
  id: string
  ageRange?: string
  sex?: string
  symptoms: string[]
  diagnostics: string[]
  treatments: string[]
  evolution?: string
  durationDays?: number
  outcome?: string
  diseaseName?: string
  diseaseCode?: string
  isAnonymized: boolean
  createdAt: string
}

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('')
  const [diseaseFilter, setDiseaseFilter] = useState<string>('all')
  const [sexFilter, setSexFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (diseaseFilter && diseaseFilter !== 'all') params.set('diseaseId', diseaseFilter)
  if (sexFilter && sexFilter !== 'all') params.set('sex', sexFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = useClinicalKnowledgeBaseData(paramsStr)
  const { data: diseasesData } = useDiseasesData()

  const entries = (data as { items?: KnowledgeEntry[]; total?: number })?.items ?? []
  const total = (data as { total?: number })?.total ?? 0
  const diseases = ((diseasesData as { items?: Array<{ id: string; name: string; code: string }> })?.items || [])

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base de connaissances</h1>
          <p className="text-muted-foreground">Cas cliniques anonymisés pour la recherche</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={diseaseFilter} onValueChange={(v) => { setDiseaseFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les maladies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les maladies</SelectItem>
            {diseases.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sexFilter} onValueChange={(v) => { setSexFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tous les sexes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sexes</SelectItem>
            <SelectItem value="M">Masculin</SelectItem>
            <SelectItem value="F">Féminin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maladie</TableHead>
                <TableHead>Âge</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Symptômes</TableHead>
                <TableHead>Diagnostics</TableHead>
                <TableHead>Évolution</TableHead>
                <TableHead>Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun cas trouvé
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.diseaseName || '—'}</p>
                        <p className="text-xs text-muted-foreground">{entry.diseaseCode || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.ageRange || '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.sex === 'M' ? 'Masculin' : entry.sex === 'F' ? 'Féminin' : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(entry.symptoms || []).slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {(entry.symptoms || []).length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{entry.symptoms.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(entry.diagnostics || []).slice(0, 2).map((d, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.outcome === 'GUERISON' ? 'default' : 'secondary'}>
                        {entry.evolution || entry.outcome || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.durationDays ? `${entry.durationDays}j` : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} cas au total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
