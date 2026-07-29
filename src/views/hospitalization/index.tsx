'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Search, ChevronLeft, ChevronRight, DoorOpen, LogOut, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useCareEpisodesData, usePatientsData, useCreateCareEpisode, useUpdateCareEpisode } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

const episodeStatusConfig: Record<string, { label: string; color: string }> = {
  ADMITTED: { label: 'Admis', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  HOSPITALIZED: { label: 'Hospitalisé', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  DISCHARGED: { label: 'Sorti', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  TRANSFERRED: { label: 'Transféré', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
}

const dischargeOutcomeLabels: Record<string, string> = {
  GUERISON: 'Guérison',
  AMELIORATION: 'Amélioration',
  DECES: 'Décès',
  TRANSFERT: 'Transfert',
  FUITE: 'Fuite',
}

interface EpisodeItem {
  id: string; patientId?: string; episodeNumber?: string; status?: string
  admitDate?: string; dischargeDate?: string; admitReason?: string
  dischargeOutcome?: string; dischargeSummary?: Record<string, unknown>
  patientFirstname?: string; patientLastname?: string
  isArchived?: boolean; createdAt?: string
  [key: string]: unknown
}

export { HospitalizationView }
export default function HospitalizationView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'hospitalized' | 'discharged'>('hospitalized')
  const [currentPage, setCurrentPage] = useState(1)

  const statusFilter = tab === 'hospitalized' ? 'HOSPITALIZED' : 'DISCHARGED'
  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    `status=${statusFilter}`,
  ].join('&')
  const { data: episodesData, isLoading } = useCareEpisodesData(searchParams)
  const { data: patientsData } = usePatientsData()

  const createEpisode = useCreateCareEpisode()
  const updateEpisode = useUpdateCareEpisode()

  const patientsList = ((patientsData as Record<string, unknown>)?.items ?? []) as Record<string, unknown>[]

  const allItems = ((episodesData as Record<string, unknown>)?.items ?? []) as EpisodeItem[]
  const totalCount = ((episodesData as Record<string, unknown>)?.total ?? 0) as number
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const [admitOpen, setAdmitOpen] = useState(false)
  const [admitForm, setAdmitForm] = useState({ patientId: '', admitReason: '' })
  const [admitting, setAdmitting] = useState(false)

  const [dischargeOpen, setDischargeOpen] = useState(false)
  const [dischargeItem, setDischargeItem] = useState<EpisodeItem | null>(null)
  const [dischargeForm, setDischargeForm] = useState({ outcome: '', summary: '' })
  const [discharging, setDischarging] = useState(false)

  const openDischarge = (item: EpisodeItem) => {
    setDischargeItem(item)
    setDischargeForm({
      outcome: item.dischargeOutcome || '',
      summary: JSON.stringify(item.dischargeSummary || {}, null, 2) === '{}' ? '' : String(item.dischargeSummary?.summary || ''),
    })
    setDischargeOpen(true)
  }

  const handleAdmit = async () => {
    if (!admitForm.patientId || !admitForm.admitReason) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient et saisir le motif.', variant: 'destructive' })
      return
    }
    setAdmitting(true)
    try {
      await createEpisode.mutateAsync({
        patientId: admitForm.patientId,
        status: 'HOSPITALIZED',
        admitReason: admitForm.admitReason,
      })
      toast({ title: 'Succès', description: 'Patient hospitalisé avec succès.' })
      setAdmitOpen(false)
      setAdmitForm({ patientId: '', admitReason: '' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'hospitaliser le patient.', variant: 'destructive' })
    } finally {
      setAdmitting(false)
    }
  }

  const handleDischarge = async () => {
    if (!dischargeItem || !dischargeForm.outcome) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner l\'issue de la sortie.', variant: 'destructive' })
      return
    }
    setDischarging(true)
    try {
      await updateEpisode.mutateAsync({
        id: dischargeItem.id,
        data: {
          status: 'DISCHARGED',
          dischargeDate: new Date().toISOString(),
          dischargeOutcome: dischargeForm.outcome,
          dischargeSummary: { summary: dischargeForm.summary, date: new Date().toISOString() },
        },
      })
      toast({ title: 'Succès', description: 'Patient sorti avec succès.' })
      setDischargeOpen(false)
      setDischargeItem(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de finaliser la sortie.', variant: 'destructive' })
    } finally {
      setDischarging(false)
    }
  }

  const hospitalizedCount = tab === 'hospitalized' ? totalCount : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospitalisation</h1>
          <p className="text-sm text-muted-foreground">
            {tab === 'hospitalized'
              ? `${hospitalizedCount} patient(s) hospitalisé(s)`
              : 'Historique des sorties'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'hospitalized' && (
            <Button onClick={() => setAdmitOpen(true)} disabled={!can('episodes:create')}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle admission
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b pb-2">
        <Button variant={tab === 'hospitalized' ? 'default' : 'ghost'} size="sm" onClick={() => { setTab('hospitalized'); setCurrentPage(1) }}>
          <DoorOpen className="h-4 w-4 mr-1" /> Hospitalisés
        </Button>
        <Button variant={tab === 'discharged' ? 'default' : 'ghost'} size="sm" onClick={() => { setTab('discharged'); setCurrentPage(1) }}>
          <LogOut className="h-4 w-4 mr-1" /> Sortis
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Épisode</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Motif admission</TableHead>
                <TableHead>Date admission</TableHead>
                <TableHead>Statut</TableHead>
                {tab === 'discharged' && <TableHead>Issue</TableHead>}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: tab === 'discharged' ? 7 : 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : allItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tab === 'discharged' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    {tab === 'hospitalized' ? 'Aucun patient hospitalisé' : 'Aucune sortie enregistrée'}
                  </TableCell>
                </TableRow>
              ) : (
                allItems.map((item) => {
                  const sc = episodeStatusConfig[item.status || ''] || { label: item.status || '—', color: '' }
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.episodeNumber || '—'}</TableCell>
                      <TableCell>
                        {item.patientFirstname || ''} {item.patientLastname || ''}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.admitReason || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.admitDate ? formatDate(item.admitDate) : '—'}</TableCell>
                      <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                      {tab === 'discharged' && (
                        <TableCell>
                          {item.dischargeOutcome ? dischargeOutcomeLabels[item.dischargeOutcome] || item.dischargeOutcome : '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {tab === 'hospitalized' && (
                          <Button size="sm" variant="outline" onClick={() => openDischarge(item)} disabled={!can('episodes:edit')}>
                            <LogOut className="h-4 w-4 mr-1" /> Sortie
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={admitOpen} onOpenChange={setAdmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle admission</DialogTitle>
            <DialogDescription>Hospitaliser un patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={admitForm.patientId} onValueChange={(v) => setAdmitForm((f) => ({ ...f, patientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientsList.map((p) => (
                    <SelectItem key={p.id as string} value={p.id as string}>
                      {p.firstname as string} {p.lastname as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motif d'admission <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Motif de l'hospitalisation"
                value={admitForm.admitReason}
                onChange={(e) => setAdmitForm((f) => ({ ...f, admitReason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitOpen(false)} disabled={admitting}>Annuler</Button>
            <Button onClick={handleAdmit} disabled={admitting}>
              {admitting ? 'Admission...' : 'Hospitaliser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sortie du patient</DialogTitle>
            <DialogDescription>
              {dischargeItem ? `${dischargeItem.patientFirstname || ''} ${dischargeItem.patientLastname || ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Issue de la sortie <span className="text-destructive">*</span></Label>
              <Select value={dischargeForm.outcome} onValueChange={(v) => setDischargeForm((f) => ({ ...f, outcome: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUERISON">Guérison</SelectItem>
                  <SelectItem value="AMELIORATION">Amélioration</SelectItem>
                  <SelectItem value="DECES">Décès</SelectItem>
                  <SelectItem value="TRANSFERT">Transfert</SelectItem>
                  <SelectItem value="FUITE">Fuite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Résumé clinique</Label>
              <Textarea
                placeholder="Résumé de l'hospitalisation"
                value={dischargeForm.summary}
                onChange={(e) => setDischargeForm((f) => ({ ...f, summary: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDischargeOpen(false)} disabled={discharging}>Annuler</Button>
            <Button onClick={handleDischarge} disabled={discharging}>
              {discharging ? 'Sortie...' : 'Finaliser la sortie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
