'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Calendar, Filter, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useClinicalCasesData, usePatientsData, useUsersData, useFacilitiesData } from '@/hooks/use-data'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { CaseStatus } from '@/types'

const ITEMS_PER_PAGE = 10

const statusLabels: Record<CaseStatus, string> = {
  draft: 'Brouillon',
  active: 'En cours',
  in_review: 'En Revu',
  resolved: 'Résolu',
  archived: 'Archivé',
}

interface TreatmentEntry {
  id: string
  date: string
  patientName: string
  caseTitle: string
  diagnosis: string
  treatment: string
  doctorName: string
  status: CaseStatus
  facilityId: string
}

function buildEntries(
  cases: Array<Record<string, unknown>>,
  patients: Array<Record<string, unknown>>,
  users: Array<Record<string, unknown>>,
): TreatmentEntry[] {
  const patientMap = new Map(patients.map((p) => [p.id, `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Inconnu']))
  const userMap = new Map(users.map((u) => [u.id, u.name || 'Inconnu']))
  return cases.map((c) => ({
    id: c.id as string,
    date: (c.createdAt as string) || new Date().toISOString(),
    patientName: patientMap.get(c.patientId as string) || 'Inconnu',
    caseTitle: (c.title as string) || 'Sans titre',
    diagnosis: (c.diagnosis as string) || '—',
    treatment: (c.treatment as string) || '—',
    doctorName: (userMap.get(c.assignedDoctorId as string) as string) || 'Inconnu',
    status: (c.status as CaseStatus) || 'draft',
    facilityId: (c.facilityId as string) || '',
  }))
}

export default function TreatmentHistoryPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [facilityFilter, setFacilityFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: casesData, isLoading: casesLoading } = useClinicalCasesData()
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()

  const facilities = ((facilitiesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>

  const entries = useMemo(() => buildEntries(
    ((casesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>,
    ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>,
    ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>
  ), [casesData, patientsData, usersData])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        e.patientName.toLowerCase().includes(q) ||
        e.caseTitle.toLowerCase().includes(q) ||
        e.diagnosis.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      const matchesFacility = facilityFilter === 'all' || e.facilityId === facilityFilter

      const entryDate = new Date(e.date)
      const matchesFrom = !dateFrom || entryDate >= new Date(dateFrom)
      const matchesTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesStatus && matchesFacility && matchesFrom && matchesTo
    })
  }, [entries, search, statusFilter, facilityFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalCount = filtered.length
  const activeCount = filtered.filter((e) => e.status === 'active').length
  const resolvedCount = filtered.filter((e) => e.status === 'resolved').length
  const archivedCount = filtered.filter((e) => e.status === 'archived').length

  const stats = [
    { label: 'Total', value: totalCount, color: 'text-foreground' },
    { label: 'En cours', value: activeCount, color: 'text-blue-600' },
    { label: 'Résolus', value: resolvedCount, color: 'text-green-600' },
    { label: 'Archivés', value: archivedCount, color: 'text-slate-500' },
  ]

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Chargement de l'historique...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Historique des Traitements
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultez l'historique complet des traitements et suivis patients.
          </p>
        </div>
        <Button variant="outline" onClick={() => toast({ title: 'Export en cours...', description: 'Le fichier sera bientôt disponible.' })}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient, cas ou diagnostic..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="in_review">En Revu</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Période :</span>
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
            className="w-full sm:w-[160px]"
            placeholder="Du"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
            className="w-full sm:w-[160px]"
            placeholder="Au"
          />
          <Select value={facilityFilter} onValueChange={(v) => { setFacilityFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Établissement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.id as string} value={f.id as string}>{f.name as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">Aucun traitement trouvé</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez vos filtres pour résultats.
          </p>
        </div>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Patient</TableHead>
                  <TableHead>Cas Clinique</TableHead>
                  <TableHead className="hidden lg:table-cell">Diagnostic</TableHead>
                  <TableHead className="hidden xl:table-cell">Traitement</TableHead>
                  <TableHead className="hidden md:table-cell">Médecin</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(entry.date)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium">
                      {entry.patientName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="line-clamp-1 text-sm">{entry.caseTitle}</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground md:hidden">{entry.patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="line-clamp-1 text-sm">{entry.diagnosis}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="line-clamp-1 text-sm text-muted-foreground">{entry.treatment}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {entry.doctorName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status}>{statusLabels[entry.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
