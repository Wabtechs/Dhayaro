'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
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
  useConsultationsData,
  useDiagnosticsData,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

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

  const { data, isLoading } = useTreatmentsListData(
    search ? `search=${search}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}` : (statusFilter !== 'all' ? `status=${statusFilter}` : '')
  )

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: consultationsData } = useConsultationsData()
  const { data: diagnosticsData } = useDiagnosticsData()

  const createTreatment = useCreateTreatment()
  const updateTreatment = useUpdateTreatment()
  const deleteTreatment = useDeleteTreatment()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const consultationsList = (consultationsData?.items ?? []) as Array<{ id: string; consultationNumber?: string; [key: string]: unknown }>
  const diagnosticsList = (diagnosticsData?.items ?? []) as Array<{ id: string; description?: string; [key: string]: unknown }>

  const doctorsList = usersList.filter((u) => u.role === 'DOCTOR' || u.role === 'SPECIALIST')

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as TreatmentItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (!search) return true
      const pName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim().toLowerCase()
      const dName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim().toLowerCase()
      return (
        String(item.description || '').toLowerCase().includes(q) ||
        pName.includes(q) ||
        dName.includes(q)
      )
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<TreatmentItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [newTreatment, setNewTreatment] = useState({
    patientId: '',
    doctorId: '',
    consultationId: '',
    diagnosisId: '',
    description: '',
    status: 'PRESCRIBED' as string,
    startDate: '',
    endDate: '',
    notes: '',
    outcome: '',
  })

  const [editForm, setEditForm] = useState({
    patientId: '',
    doctorId: '',
    consultationId: '',
    diagnosisId: '',
    description: '',
    status: 'PRESCRIBED' as string,
    startDate: '',
    endDate: '',
    notes: '',
    outcome: '',
  })

  const resetNewTreatment = () => {
    setNewTreatment({
      patientId: '',
      doctorId: '',
      consultationId: '',
      diagnosisId: '',
      description: '',
      status: 'PRESCRIBED',
      startDate: '',
      endDate: '',
      notes: '',
      outcome: '',
    })
  }

  const handleCreate = async () => {
    if (!newTreatment.patientId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient.', variant: 'destructive' })
      return
    }
    if (!newTreatment.description.trim()) {
      toast({ title: 'Erreur', description: 'La description est requise.', variant: 'destructive' })
      return
    }
    if (!newTreatment.startDate) {
      toast({ title: 'Erreur', description: 'La date de début est requise.', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await createTreatment.mutateAsync({
        patientId: sanitizeUuid(newTreatment.patientId),
        doctorId: sanitizeUuid(newTreatment.doctorId),
        consultationId: sanitizeUuid(newTreatment.consultationId) || undefined,
        diagnosisId: sanitizeUuid(newTreatment.diagnosisId) || undefined,
        description: newTreatment.description,
        status: newTreatment.status,
        startDate: newTreatment.startDate,
        endDate: newTreatment.endDate || null,
        notes: newTreatment.notes || null,
        outcome: newTreatment.outcome || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['treatments-list'] })
      toast({ title: 'Traitement créé', description: `"${newTreatment.description}" a été enregistré.` })
      setDialogOpen(false)
      resetNewTreatment()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le traitement.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (t: TreatmentItem) => {
    setEditingTreatment(t)
    setEditForm({
      patientId: (t.patientId as string) || '',
      doctorId: (t.doctorId as string) || '',
      consultationId: (t.consultationId as string) || '',
      diagnosisId: (t.diagnosisId as string) || '',
      description: (t.description as string) || '',
      status: (t.status as string) || 'PRESCRIBED',
      startDate: (t.startDate as string) || '',
      endDate: (t.endDate as string) || '',
      notes: (t.notes as string) || '',
      outcome: (t.outcome as string) || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingTreatment) return
    setSaving(true)
    try {
      await updateTreatment.mutateAsync({
        id: editingTreatment.id as string,
        data: {
          patientId: sanitizeUuid(editForm.patientId),
          doctorId: sanitizeUuid(editForm.doctorId),
          consultationId: sanitizeUuid(editForm.consultationId) || undefined,
          diagnosisId: sanitizeUuid(editForm.diagnosisId) || undefined,
          description: editForm.description,
          status: editForm.status,
          startDate: editForm.startDate,
          endDate: editForm.endDate || null,
          notes: editForm.notes || null,
          outcome: editForm.outcome || null,
        },
      })
      toast({ title: 'Traitement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingTreatment(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le traitement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

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
              {filtered.length} traitement{filtered.length > 1 ? 's' : ''}
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
                  <Select value={newTreatment.patientId} onValueChange={(v) => setNewTreatment({ ...newTreatment, patientId: v })}>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Médecin *</label>
                  <Select value={newTreatment.doctorId} onValueChange={(v) => setNewTreatment({ ...newTreatment, doctorId: v })}>
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
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation</label>
                  <Select value={newTreatment.consultationId} onValueChange={(v) => setNewTreatment({ ...newTreatment, consultationId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {String(c.consultationNumber || c.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diagnostic</label>
                  <Select value={newTreatment.diagnosisId} onValueChange={(v) => setNewTreatment({ ...newTreatment, diagnosisId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un diagnostic" />
                    </SelectTrigger>
                    <SelectContent>
                      {diagnosticsList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {String(d.description || d.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Description du traitement"
                  rows={3}
                  value={newTreatment.description}
                  onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={newTreatment.status} onValueChange={(v) => setNewTreatment({ ...newTreatment, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date début *</label>
                  <Input
                    type="date"
                    value={newTreatment.startDate}
                    onChange={(e) => setNewTreatment({ ...newTreatment, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={newTreatment.endDate}
                  onChange={(e) => setNewTreatment({ ...newTreatment, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes cliniques"
                  rows={3}
                  value={newTreatment.notes}
                  onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue / Résultat</label>
                <Input
                  placeholder="Issue du traitement"
                  value={newTreatment.outcome}
                  onChange={(e) => setNewTreatment({ ...newTreatment, outcome: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newTreatment.patientId || !newTreatment.description.trim() || !newTreatment.startDate} onClick={handleCreate}>
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
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
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
                  {paginated.map((item: TreatmentItem) => {
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient *</label>
                <Select value={editForm.patientId} onValueChange={(v) => setEditForm({ ...editForm, patientId: v })}>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Médecin *</label>
                <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
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
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Consultation</label>
                <Select value={editForm.consultationId} onValueChange={(v) => setEditForm({ ...editForm, consultationId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une consultation" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {String(c.consultationNumber || c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Diagnostic</label>
                <Select value={editForm.diagnosisId} onValueChange={(v) => setEditForm({ ...editForm, diagnosisId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un diagnostic" />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnosticsList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {String(d.description || d.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date début *</label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date fin</label>
              <Input
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue / Résultat</label>
              <Input
                value={editForm.outcome}
                onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving} onClick={handleUpdate}>
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
