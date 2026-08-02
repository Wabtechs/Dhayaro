'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Pill,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  useTreatmentsListData,
  usePatientsData,
  useUsersData,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { treatmentCreateSchema, treatmentEditSchema, toTreatmentPayload, TREATMENT_STATUSES, type TreatmentCreateValues, type TreatmentEditValues } from '@/lib/schemas'
import { Skeleton } from '@/components/ui/skeleton'

const statusConfig: Record<string, { label: string; color: string }> = {
  PRESCRIBED: { label: 'Prescrit', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  SUSPENDED: { label: 'Suspendu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
}

interface TreatmentItem {
  id: string
  facilityId?: string
  consultationId?: string
  patientId: string
  doctorId: string
  diagnosisId?: string
  description: string
  status: string
  startDate: string
  endDate?: string
  notes?: string
  outcome?: string
  createdAt: string
  updatedAt: string
  patientFirstname?: string
  patientLastname?: string
  doctorFirstname?: string
  doctorLastname?: string
  [key: string]: unknown
}

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  [key: string]: unknown
}

interface UserItem {
  id: string
  name?: string
  role?: string
  firstName?: string
  lastName?: string
  [key: string]: unknown
}

const STATUS_OPTIONS = [
  { value: 'PRESCRIBED', label: 'Prescrit' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'SUSPENDED', label: 'Suspendu' },
]

export { TreatmentsView }
export default function TreatmentsView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(statusFilter !== 'all' ? [`status=${statusFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useTreatmentsListData(searchParams)

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()

  const createTreatment = useCreateTreatment()
  const updateTreatment = useUpdateTreatment()
  const deleteTreatment = useDeleteTreatment()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const doctorsList = ((usersData?.items ?? []) as UserItem[]).filter((u) =>
    ['doctor', 'specialist'].includes(String(u.role || '').toLowerCase())
  )

  const items = (data?.items ?? []) as TreatmentItem[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<TreatmentItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const createForm = useForm<TreatmentCreateValues>({
    resolver: zodResolver(treatmentCreateSchema),
    defaultValues: { patientId: '', doctorId: '', consultationId: '', diagnosisId: '', description: '', status: 'PRESCRIBED', startDate: '', endDate: '', notes: '', outcome: '' },
  })
  const editForm = useForm<TreatmentEditValues>({
    resolver: zodResolver(treatmentEditSchema),
    defaultValues: { description: '', status: 'PRESCRIBED', startDate: '', endDate: '', notes: '', outcome: '' },
  })

  const onCreate = createForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      await createTreatment.mutateAsync(toTreatmentPayload(values))
      await queryClient.invalidateQueries({ queryKey: ['treatments-list'] })
      toast({ title: 'Traitement créé', description: `"${values.description}" a été enregistré.` })
      setDialogOpen(false)
      createForm.reset()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le traitement.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  const openEdit = (t: TreatmentItem) => {
    setEditingTreatment(t)
    editForm.reset({
      description: String(t.description ?? ''),
      status: (TREATMENT_STATUSES as readonly string[]).includes(t.status as string) ? (t.status as TreatmentEditValues['status']) : 'PRESCRIBED',
      startDate: String(t.startDate ?? ''),
      endDate: String(t.endDate ?? ''),
      notes: String(t.notes ?? ''),
      outcome: String(t.outcome ?? ''),
    })
    setEditDialogOpen(true)
  }

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!editingTreatment) return
    setSaving(true)
    try {
      await updateTreatment.mutateAsync({
        id: editingTreatment.id as string,
        data: toTreatmentPayload(values),
      })
      toast({ title: 'Traitement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingTreatment(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le traitement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = (t: TreatmentItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir annuler ce traitement "${t.description}" ?`,
      callback: async () => {
        try {
          await deleteTreatment.mutateAsync(t.id as string)
          toast({ title: 'Traitement annulé', description: `"${t.description}" a été annulé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible d\'annuler le traitement.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Traitements</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} traitement{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('treatments:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Traitement
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Traitement</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer un nouveau traitement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
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
                          {patientsList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {(p.firstName || '') + ' ' + (p.lastName || '')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.patientId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.patientId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Médecin *</label>
                  <Controller
                    control={createForm.control}
                    name="doctorId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctorsList.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {(u.firstName || '') + ' ' + (u.lastName || '')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.doctorId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.doctorId.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Description du traitement"
                  rows={3}
                  {...createForm.register('description')}
                />
                {createForm.formState.errors.description && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Controller
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TREATMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début *</label>
                  <Input
                    type="date"
                    {...createForm.register('startDate')}
                  />
                  {createForm.formState.errors.startDate && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date fin</label>
                  <Input
                    type="date"
                    {...createForm.register('endDate')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Notes cliniques"
                    rows={2}
                    {...createForm.register('notes')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue / Résultat</label>
                  <Textarea
                    placeholder="Résultat attendu ou observé"
                    rows={2}
                    {...createForm.register('outcome')}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating} onClick={onCreate}>
                {creating ? 'Création...' : 'Créer le traitement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un traitement..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun traitement disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: TreatmentItem) => {
                    const status = String(item.status || '').toUpperCase()
                    const config = statusConfig[status] || { label: status || '—', color: 'bg-gray-100 text-gray-700' }
                    const pName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim()
                    const dName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim()
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/treatments/${item.id}`)}
                      >
                        <TableCell className="max-w-[240px] truncate font-medium">
                          {String(item.description || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {pName || '—'}
                        </TableCell>
                        <TableCell>{dName || '—'}</TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.startDate as string)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.endDate ? formatDate(item.endDate as string) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/ordonnance/${item.id}`)}
                            >
                              <Pill className="h-4 w-4" />
                            </Button>
                            {can('treatments:create') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('treatments:delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/treatments/${item.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le traitement</DialogTitle>
            <DialogDescription>
              Modifiez les informations du traitement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                rows={3}
                {...editForm.register('description')}
              />
              {editForm.formState.errors.description && (
                <p className="text-xs text-destructive">{editForm.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Controller
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TREATMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date début</label>
                <Input
                  type="date"
                  {...editForm.register('startDate')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  {...editForm.register('endDate')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  rows={2}
                  {...editForm.register('notes')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue / Résultat</label>
                <Textarea
                  rows={2}
                  {...editForm.register('outcome')}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving} onClick={onUpdate}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDelete?.callback(); setConfirmDelete(null) }}>
              Annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
