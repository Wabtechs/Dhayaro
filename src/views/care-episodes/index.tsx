'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ClipboardList, Calendar, User, ArrowRight, Archive, Eye, FileText } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCareEpisodesData, useCreateCareEpisode, usePatientsData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

interface EpisodeItem {
  id: string
  patientId: string
  patientFirstname?: string
  patientLastname?: string
  episodeNumber: string
  status: string
  admitDate: string
  dischargeDate?: string
  admitReason?: string
  dischargeOutcome?: string
  isArchived: boolean
  createdAt: string
}

const statusColors: Record<string, string> = {
  ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  TRIAGE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONSULTATION: 'bg-purple-100 text-purple-800 border-purple-200',
  TREATMENT: 'bg-orange-100 text-orange-800 border-orange-200',
  HOSPITALIZED: 'bg-red-100 text-red-800 border-red-200',
  DISCHARGED: 'bg-green-100 text-green-800 border-green-200',
  TRANSFERRED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<string, string> = {
  ADMITTED: 'Admis',
  TRIAGE: 'Triage',
  CONSULTATION: 'Consultation',
  TREATMENT: 'Traitement',
  HOSPITALIZED: 'Hospitalisé',
  DISCHARGED: 'Sorti',
  TRANSFERRED: 'Transféré',
  ARCHIVED: 'Archivé',
}

export default function CareEpisodesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (statusFilter && statusFilter !== 'all') p.set('status', statusFilter)
    p.set('page', String(page))
    p.set('size', String(ITEMS_PER_PAGE))
    return p.toString()
  }, [search, statusFilter, page])

  const { data, isLoading } = useCareEpisodesData(params)
  const { data: patientsData } = usePatientsData()
  const createEpisode = useCreateCareEpisode()

  const episodes = (data as { items?: EpisodeItem[]; total?: number })?.items || []
  const total = (data as { total?: number })?.total || 0
  const patients = ((patientsData as { items?: Array<{ id: string; firstName?: string; lastName?: string; name?: string }> })?.items || [])

  const [newEpisode, setNewEpisode] = useState({ patientId: '', admitReason: '' })

  const handleCreate = async () => {
    if (!newEpisode.patientId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient', variant: 'destructive' })
      return
    }
    try {
      await createEpisode.mutateAsync({
        patientId: newEpisode.patientId,
        admitReason: newEpisode.admitReason || null,
        status: 'ADMITTED',
      })
      toast({ title: 'Succès', description: 'Épisode de soins créé' })
      setShowCreateDialog(false)
      setNewEpisode({ patientId: '', admitReason: '' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'épisode', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Épisodes de soins</h1>
          <p className="text-muted-foreground">Gestion des parcours patients</p>
        </div>
        {can('episodes:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel épisode
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un épisode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date admission</TableHead>
                <TableHead>Date sortie</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : episodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun épisode trouvé
                  </TableCell>
                </TableRow>
              ) : (
                episodes.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell className="font-mono text-sm">{ep.episodeNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {ep.patientFirstname} {ep.patientLastname}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[ep.status] || ''}>
                        {statusLabels[ep.status] || ep.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ep.admitDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ep.dischargeDate ? formatDate(ep.dischargeDate) : '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {ep.admitReason || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/care-episodes/${ep.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/care-episodes/${ep.id}/fiche`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
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
            {total} épisode(s) au total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel épisode de soins</DialogTitle>
            <DialogDescription>
              Créer un nouvel épisode pour un patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient *</label>
              <Select value={newEpisode.patientId} onValueChange={(v) => setNewEpisode(prev => ({ ...prev, patientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: { id: string; firstName?: string; lastName?: string; name?: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || 'Patient'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Motif d&apos;admission</label>
              <Input
                placeholder="Motif de l'admission..."
                value={newEpisode.admitReason}
                onChange={(e) => setNewEpisode(prev => ({ ...prev, admitReason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createEpisode.isPending}>
              {createEpisode.isPending ? 'Création...' : 'Créer l\'épisode'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
