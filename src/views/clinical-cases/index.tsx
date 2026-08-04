'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Tag,
  User,
  Stethoscope,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
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
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clinicalCaseSchema, toClinicalCasePayload, CASE_PRIORITIES, type ClinicalCaseValues } from '@/lib/schemas'
import { useClinicalCasesData, usePatientsData, useFacilitiesData, useUsersData, useUpdateClinicalCase, useDeleteClinicalCase } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { api } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { CaseStatus, CasePriority } from '@/types'

interface CaseItem {
  id: string
  title: string
  description: string
  status: string
  priority: string
  diagnosis: string
  symptoms: string[]
  tags: string[]
  patientId?: string
  facilityId?: string
  assignedDoctorId?: string
  treatment?: string
  [key: string]: unknown
}

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  [key: string]: unknown
}

interface FacilityItem {
  id: string
  name: string
  [key: string]: unknown
}

interface UserItem {
  id: string
  name?: string
  role?: string
  firstname?: string
  lastname?: string
  [key: string]: unknown
}

const statusLabels: Record<CaseStatus, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En Revu',
  resolved: 'Résolu',
  archived: 'Archivé',
}

const priorityLabels: Record<CasePriority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
}

export default function ClinicalCasesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [facilityFilter, setFacilityFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const updateCase = useUpdateClinicalCase()
  const deleteCase = useDeleteClinicalCase()

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const createForm = useForm<ClinicalCaseValues>({
    resolver: zodResolver(clinicalCaseSchema),
    defaultValues: { title: '', description: '', patientId: '', facilityId: '', assignedDoctorId: '', priority: 'medium', diagnosis: '', symptoms: '', tags: '' },
  })
  const editForm = useForm<ClinicalCaseValues>({
    resolver: zodResolver(clinicalCaseSchema),
    defaultValues: { title: '', description: '', patientId: '', facilityId: '', assignedDoctorId: '', priority: 'medium', diagnosis: '', symptoms: '', tags: '' },
  })

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(statusFilter !== 'all' ? [`status=${statusFilter}`] : []),
    ...(priorityFilter !== 'all' ? [`priority=${priorityFilter}`] : []),
    ...(facilityFilter !== 'all' ? [`facilityId=${facilityFilter}`] : []),
  ].join('&')

  const { data: casesData, isLoading } = useClinicalCasesData(searchParams)
  const { data: patientsData } = usePatientsData()
  const { data: facilitiesData } = useFacilitiesData()
  const { data: usersData } = useUsersData()
  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const facilitiesList = (facilitiesData?.items ?? []) as FacilityItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]

  const items = ((casesData?.items ?? []) as unknown as CaseItem[])
  const totalCount = casesData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const getPatientName = (patientId: string) => {
    const patient = patientsList.find((p) => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu'
  }

  const getDoctorName = (doctorId: string) => {
    const doctor = usersList.find((u) => u.id === doctorId)
    return doctor ? `${doctor.firstName || doctor.firstname || ''} ${doctor.lastName || doctor.lastname || ''}`.trim() || 'Inconnu' : 'Inconnu'
  }

  const onCreateCase = createForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/clinical-cases', toClinicalCasePayload(values), token)
      await queryClient.invalidateQueries({ queryKey: ['clinical-cases'] })
      toast({ title: 'Cas créé', description: `"${values.title}" a été ajouté.` })
      setDialogOpen(false)
      createForm.reset()
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer le cas clinique.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  const openEditDialog = (c: CaseItem) => {
    setEditingCase(c)
    editForm.reset({
      title: (c.title as string) || '',
      description: (c.description as string) || '',
      patientId: (c.patientId as string) || '',
      facilityId: (c.facilityId as string) || '',
      assignedDoctorId: (c.assignedDoctorId as string) || (c.doctorId as string) || '',
      priority: ((c.priority as string) || 'medium') as ClinicalCaseValues['priority'],
      diagnosis: (c.diagnosis as string) || '',
      symptoms: Array.isArray(c.symptoms) ? (c.symptoms as string[]).join(', ') : '',
      tags: Array.isArray(c.tags) ? (c.tags as string[]).join(', ') : '',
    })
    setEditDialogOpen(true)
  }

  const onUpdateCase = editForm.handleSubmit(async (values) => {
    if (!editingCase) return
    setSaving(true)
    try {
      await updateCase.mutateAsync({
        id: editingCase.id as string,
        data: toClinicalCasePayload(values),
      })
      toast({ title: 'Cas mis à jour', description: `"${values.title}" a été modifié.` })
      setEditDialogOpen(false)
      setEditingCase(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier le cas clinique.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleDeleteCase = (c: Record<string, unknown>) => {
    const title = (c.title as string) || 'ce cas'
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer "${title}" ? Cette action est irréversible.`,
      callback: async () => {
        try {
          await deleteCase.mutateAsync(c.id as string)
          toast({ title: 'Cas supprimé', description: `"${title}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: "Impossible de supprimer le cas.", variant: 'destructive' })
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        {viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border">
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
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cas Cliniques
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} cas trouvé{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('clinical-cases:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Cas
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Cas</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour créer un nouveau cas
                clinique.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreateCase} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Titre *
                </label>
                <Input
                  placeholder="Titre du cas"
                  {...createForm.register('title')}
                />
                {createForm.formState.errors.title && <p className="text-xs text-destructive">{createForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  placeholder="Description détaillée du cas"
                  rows={3}
                  {...createForm.register('description')}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Patient
                  </label>
                  <Controller
                    name="patientId"
                    control={createForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patientsList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.patientId && <p className="text-xs text-destructive">{createForm.formState.errors.patientId.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Établissement
                  </label>
                  <Controller
                    name="facilityId"
                    control={createForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un établissement" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilitiesList.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Médecin assigné
                  </label>
                  <Controller
                    name="assignedDoctorId"
                    control={createForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersList
                            .filter((u) => u.role === 'doctor')
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.firstName || u.firstname || u.lastName || u.lastname ? `${u.firstName || u.firstname || ''} ${u.lastName || u.lastname || ''}`.trim() : '—'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Priorité
                    </label>
                  <Controller
                    name="priority"
                    control={createForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          {CASE_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.priority && <p className="text-xs text-destructive">{createForm.formState.errors.priority.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Diagnostic
                </label>
                <Input
                  placeholder="Diagnostic principal"
                  {...createForm.register('diagnosis')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Symptômes (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Fièvre, Toux, Douleur"
                  {...createForm.register('symptoms')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Cardiologie, Urgence"
                  {...createForm.register('tags')}
                />
              </div>
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating} onClick={onCreateCase}>{creating ? 'Création...' : 'Créer le cas'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le Cas Clinique</DialogTitle>
              <DialogDescription>
                Modifiez les informations de ce cas clinique.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Titre *
                </label>
                <Input
                  placeholder="Titre du cas"
                  {...editForm.register('title')}
                />
                {editForm.formState.errors.title && <p className="text-xs text-destructive">{editForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  placeholder="Description détaillée du cas"
                  rows={3}
                  {...editForm.register('description')}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Patient
                  </label>
                  <Controller
                    name="patientId"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patientsList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editForm.formState.errors.patientId && <p className="text-xs text-destructive">{editForm.formState.errors.patientId.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Établissement
                  </label>
                  <Controller
                    name="facilityId"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un établissement" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilitiesList.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Médecin assigné
                  </label>
                  <Controller
                    name="assignedDoctorId"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersList
                            .filter((u) => u.role === 'doctor')
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.firstName || u.firstname || u.lastName || u.lastname ? `${u.firstName || u.firstname || ''} ${u.lastName || u.lastname || ''}`.trim() : '—'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Priorité
                    </label>
                  <Controller
                    name="priority"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          {CASE_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {editForm.formState.errors.priority && <p className="text-xs text-destructive">{editForm.formState.errors.priority.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Diagnostic
                </label>
                <Input
                  placeholder="Diagnostic principal"
                  {...editForm.register('diagnosis')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Symptômes (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Fièvre, Toux, Douleur"
                  {...editForm.register('symptoms')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Cardiologie, Urgence"
                  {...editForm.register('tags')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={saving} onClick={onUpdateCase}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="in_review">En Revu</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={facilityFilter}
              onValueChange={(v) => {
                setFacilityFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {facilitiesList.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">
            Aucun cas trouvé
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier vos filtres ou créez un nouveau cas clinique.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.id} href={`/clinical-cases/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">
                      {c.title}
                    </CardTitle>
                    {can('clinical-cases:edit') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openEditDialog(c)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    )}
                    {can('clinical-cases:delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteCase(c as unknown as Record<string, unknown>)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={c.status as 'active' | 'draft' | 'in_review' | 'resolved' | 'archived'}>{statusLabels[c.status as CaseStatus]}</Badge>
                    <Badge variant={c.priority as 'low' | 'medium' | 'high' | 'critical'}>
                      {priorityLabels[c.priority as CasePriority]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <CardDescription className="line-clamp-2 mb-3">
                    {c.description}
                  </CardDescription>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {getPatientName(c.patientId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {getDoctorName(c.assignedDoctorId)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex w-full flex-col gap-2">
                    {c.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            <Tag className="mr-1 h-2.5 w-2.5" />
                            {tag}
                          </Badge>
                        ))}
                        {c.tags && c.tags.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{c.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(c.createdAt as string)}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden md:table-cell">Patient</TableHead>
                <TableHead className="hidden md:table-cell">Médecin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden sm:table-cell">Priorité</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Date Création
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/clinical-cases/${c.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-1">{c.title}</span>
                      <div className="flex gap-1 md:hidden">
                        <Badge variant={c.status as 'active' | 'draft' | 'in_review' | 'resolved' | 'archived'} className="text-[10px]">
                          {statusLabels[c.status]}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getPatientName(c.patientId)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getDoctorName(c.assignedDoctorId)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status as 'active' | 'draft' | 'in_review' | 'resolved' | 'archived'}>{statusLabels[c.status as CaseStatus]}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={c.priority as 'low' | 'medium' | 'high' | 'critical'}>
                      {priorityLabels[c.priority as CasePriority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(c.createdAt as string)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {can('clinical-cases:edit') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(c)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      )}
                      {can('clinical-cases:delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCase(c as unknown as Record<string, unknown>)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/clinical-cases/${c.id}`)
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/clinical-cases/${c.id}/fiche`)
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

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

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDelete?.callback(); setConfirmDelete(null) }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
