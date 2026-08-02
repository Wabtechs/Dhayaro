'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { episodeCreateSchema, episodeEditSchema, toEpisodeCreatePayload, toEpisodeEditPayload, EPISODE_STATUSES, type EpisodeCreateValues, type EpisodeEditValues } from '@/lib/schemas'
import { Search, Plus, Calendar, User, Eye, FileText, Pencil, MoreHorizontal, Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCareEpisodesData, useCreateCareEpisode, useUpdateCareEpisode, useArchiveCareEpisode, useRestoreCareEpisode, usePatientsData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

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
  ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  TRIAGE: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  CONSULTATION: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  TREATMENT: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  HOSPITALIZED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  DISCHARGED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  TRANSFERRED: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
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
  const [editingEpisode, setEditingEpisode] = useState<EpisodeItem | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const createForm = useForm<EpisodeCreateValues>({
    resolver: zodResolver(episodeCreateSchema),
    defaultValues: { patientId: '', admitReason: '' },
  })

  const editForm = useForm<EpisodeEditValues>({
    resolver: zodResolver(episodeEditSchema),
    defaultValues: { status: 'ADMITTED', admitReason: '', admitDate: '', dischargeDate: '' },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = useCareEpisodesData(paramsStr)
  const { data: patientsData } = usePatientsData()
  const createEpisode = useCreateCareEpisode()
  const updateEpisode = useUpdateCareEpisode()
  const archiveEpisode = useArchiveCareEpisode()
  const restoreEpisode = useRestoreCareEpisode()

  const episodes = (data as { items?: EpisodeItem[]; total?: number })?.items ?? []
  const total = (data as { total?: number })?.total ?? 0
  const patients = ((patientsData as { items?: Array<{ id: string; firstName?: string; lastName?: string; name?: string }> })?.items || [])

  const handleCreate = createForm.handleSubmit(async (values) => {
    try {
      await createEpisode.mutateAsync(toEpisodeCreatePayload(values))
      toast({ title: 'Succès', description: 'Épisode de soins créé' })
      setShowCreateDialog(false)
      createForm.reset()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'épisode', variant: 'destructive' })
    }
  })

  const openEditDialog = (ep: EpisodeItem) => {
    setEditingEpisode(ep)
    editForm.reset({
      status: (ep.status as EpisodeEditValues['status']) || 'ADMITTED',
      admitReason: ep.admitReason || '',
      admitDate: ep.admitDate ? ep.admitDate.slice(0, 16) : '',
      dischargeDate: ep.dischargeDate ? ep.dischargeDate.slice(0, 16) : '',
    })
  }

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!editingEpisode) return
    try {
      await updateEpisode.mutateAsync({
        id: editingEpisode.id,
        data: toEpisodeEditPayload(values),
      })
      toast({ title: 'Succès', description: 'Épisode mis à jour' })
      setEditingEpisode(null)
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Impossible de modifier l\'épisode', variant: 'destructive' })
    }
  })

  const handleArchive = async (id: string) => {
    try {
      await archiveEpisode.mutateAsync(id)
      toast({ title: 'Succès', description: 'Épisode archivé' })
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Impossible d\'archiver l\'épisode', variant: 'destructive' })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreEpisode.mutateAsync(id)
      toast({ title: 'Succès', description: 'Épisode restauré' })
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Impossible de restaurer l\'épisode', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / 10)

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
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
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
                        {(can('episodes:edit') || can('episodes:archive')) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {can('episodes:edit') && (
                                <DropdownMenuItem onClick={() => openEditDialog(ep)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                              )}
                              {can('episodes:archive') && !ep.isArchived && (
                                <DropdownMenuItem onClick={() => setArchivingId(ep.id)}>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archiver
                                </DropdownMenuItem>
                              )}
                              {can('episodes:archive') && ep.isArchived && (
                                <DropdownMenuItem onClick={() => handleRestore(ep.id)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restaurer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient *</label>
              <Controller
                control={createForm.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p: { id: string; firstName?: string; lastName?: string; name?: string }) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName || p.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Patient'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createForm.formState.errors.patientId && <p className="text-xs text-destructive">{createForm.formState.errors.patientId.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Motif d&apos;admission</label>
              <Input
                placeholder="Motif de l'admission..."
                {...createForm.register('admitReason')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={createEpisode.isPending}>
                {createEpisode.isPending ? 'Création...' : 'Créer l\'épisode'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEpisode} onOpenChange={(open) => { if (!open) setEditingEpisode(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'épisode</DialogTitle>
            <DialogDescription>
              {editingEpisode?.episodeNumber} — {editingEpisode?.patientFirstname} {editingEpisode?.patientLastname}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Statut</label>
              <Controller
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {EPISODE_STATUSES.map((key) => (
                        <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {editForm.formState.errors.status && <p className="text-xs text-destructive">{editForm.formState.errors.status.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Motif d'admission</label>
              <Input
                {...editForm.register('admitReason')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date d'admission</label>
              <Input
                type="datetime-local"
                {...editForm.register('admitDate')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date de sortie</label>
              <Input
                type="datetime-local"
                {...editForm.register('dischargeDate')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingEpisode(null)}>Annuler</Button>
              <Button type="submit" disabled={updateEpisode.isPending}>
                {updateEpisode.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archivingId} onOpenChange={(open) => { if (!open) setArchivingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'archivage</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir archiver cet épisode de soins ? Cette action peut être annulée en le restaurant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (archivingId) { handleArchive(archivingId); setArchivingId(null) } }}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
