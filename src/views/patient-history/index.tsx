'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { patientHistoryCreateSchema, patientHistoryUpdateSchema, type PatientHistoryCreateValues, type PatientHistoryUpdateValues } from '@/lib/schemas'
import { Search, Plus, Activity, FileText, Clock, User, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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
import { usePatientHistoryData, usePatientsData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
}

interface PatientHistoryItem {
  id: string
  patientId: string
  episodeId?: string
  eventType: string
  title: string
  description?: string
  performedByName?: string
  outcome?: string
  followUpDate?: string
  facilityName?: string
  patientFirstname?: string
  patientLastname?: string
  episodeTitle?: string
  createdAt: string
  updatedAt: string
}

const eventTypeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  DIAGNOSIS: 'Diagnostic',
  TREATMENT: 'Traitement',
  LAB_EXAM: 'Examen labo',
  DOCUMENT: 'Document',
  ADMISSION: 'Admission',
  DISCHARGE: 'Sortie',
  TRANSFER: 'Transfert',
  SURGERY: 'Chirurgie',
  FOLLOW_UP: 'Suivi',
  OTHER: 'Autre',
}

export default function PatientHistoryPage() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<PatientHistoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createForm = useForm<PatientHistoryCreateValues>({
    resolver: zodResolver(patientHistoryCreateSchema),
    defaultValues: { eventType: 'CONSULTATION' },
  })

  const editForm = useForm<PatientHistoryUpdateValues>({
    resolver: zodResolver(patientHistoryUpdateSchema),
    defaultValues: { eventType: '', title: '', description: '' },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (eventTypeFilter && eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = usePatientHistoryData(paramsStr)
  const { data: patientsData } = usePatientsData()

  const items = (data?.items ?? []) as PatientHistoryItem[]
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 10)
  const patients = (patientsData?.items ?? []) as PatientItem[]

  const invalidateHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['patient-history'] })
  }

  const openEdit = (item: PatientHistoryItem) => {
    setEditingItem(item)
    editForm.reset({
      eventType: item.eventType,
      title: item.title,
      description: item.description || '',
      episodeId: item.episodeId || '',
    })
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      const res = await fetch(`/api/v1/patient-history/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        toast({ title: 'Succès', description: 'Événement supprimé' })
        setDeletingId(null)
        invalidateHistory()
      } else {
        toast({ title: 'Erreur', description: 'Impossible de supprimer l\'événement. Veuillez réessayer.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'événement. Vérifiez votre connexion puis réessayez.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique des patients</h1>
          <p className="text-muted-foreground">Suivi des événements cliniques</p>
        </div>
        {can('patients:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvel événement
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(eventTypeLabels).map(([key, label]) => (
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
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type d&apos;événement</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun événement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {item.patientFirstname} {item.patientLastname}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{eventTypeLabels[item.eventType] || item.eventType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {item.description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(item.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <p className="text-sm text-muted-foreground">{total} événement(s)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel événement patient</DialogTitle>
            <DialogDescription>Ajouter un événement à l&apos;historique clinique</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(async (values) => {
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch('/api/v1/patient-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Événement ajouté' })
                setShowCreateDialog(false)
                createForm.reset()
                invalidateHistory()
              } else {
                toast({ title: 'Erreur', description: 'Impossible d&apos;ajouter l&apos;événement. Vérifiez les informations saisies puis réessayez.', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible d&apos;ajouter l&apos;événement. Vérifiez votre connexion puis réessayez.', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient *</label>
              <Controller
                control={createForm.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName || p.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Patient'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type d&apos;événement *</label>
                <Controller
                  control={createForm.control}
                  name="eventType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Titre *</label>
                <Input {...createForm.register('title')} placeholder="Titre de l&apos;événement" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input {...createForm.register('description')} placeholder="Description de l&apos;événement" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;événement</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l&apos;événement</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(async (values) => {
            if (!editingItem) return
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch(`/api/v1/patient-history/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Événement mis à jour' })
                setEditingItem(null)
                invalidateHistory()
              } else {
                toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'événement. Vérifiez les informations saisies puis réessayez.', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'événement. Vérifiez votre connexion puis réessayez.', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type d&apos;événement *</label>
                <Controller
                  control={editForm.control}
                  name="eventType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Titre *</label>
                <Input {...editForm.register('title')} placeholder="Titre de l&apos;événement" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input {...editForm.register('description')} placeholder="Description de l&apos;événement" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet événement ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) handleDelete(deletingId) }} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { PatientHistoryPage }