'use client'

import { useState, useMemo } from 'react'
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
import { useClinicalCasesData, usePatientsData, useFacilitiesData, useUsersData, useUpdateClinicalCase, useDeleteClinicalCase } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { api } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'
import type { CaseStatus, CasePriority } from '@/types'

const ITEMS_PER_PAGE = 10

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
  const { data: casesData, isLoading } = useClinicalCasesData()
  const { data: patientsData } = usePatientsData()
  const { data: facilitiesData } = useFacilitiesData()
  const { data: usersData } = useUsersData()
  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const facilitiesList = (facilitiesData?.items ?? []) as FacilityItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
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

  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    patientId: '',
    facilityId: '',
    assignedDoctorId: '',
    priority: '' as CasePriority | '',
    diagnosis: '',
    symptoms: '',
    tags: '',
  })

  const [editCase, setEditCase] = useState({
    title: '',
    description: '',
    patientId: '',
    facilityId: '',
    assignedDoctorId: '',
    priority: '' as CasePriority | '',
    diagnosis: '',
    symptoms: '',
    tags: '',
  })

  const filteredCases = useMemo(() => {
    return ((casesData?.items ?? []) as unknown as CaseItem[]).filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.diagnosis.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || c.status === statusFilter
      const matchesPriority =
        priorityFilter === 'all' || c.priority === priorityFilter
      const matchesFacility =
        facilityFilter === 'all' || c.facilityId === facilityFilter
      return matchesSearch && matchesStatus && matchesPriority && matchesFacility
    })
  }, [casesData, search, statusFilter, priorityFilter, facilityFilter])

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE)
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getPatientName = (patientId: string) => {
    const patient = patientsList.find((p) => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu'
  }

  const getDoctorName = (doctorId: string) => {
    const doctor = usersList.find((u) => u.id === doctorId)
    return doctor ? doctor.name : 'Inconnu'
  }

  const handleCreateCase = async () => {
    setCreating(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/clinical-cases', {
        title: newCase.title,
        description: newCase.description,
        patientId: sanitizeUuid(newCase.patientId),
        facilityId: sanitizeUuid(newCase.facilityId),
        doctorId: sanitizeUuid(newCase.assignedDoctorId),
        provisionalDiagnosis: newCase.diagnosis,
        symptomsJson: newCase.symptoms ? { description: newCase.symptoms } : {},
        tagsJson: newCase.tags ? { tags: newCase.tags.split(',').map((t: string) => t.trim()).filter(Boolean) } : {},
        priority: newCase.priority || 'medium',
        outcomeStatus: 'PENDING',
      }, token)
      await queryClient.invalidateQueries({ queryKey: ['clinical-cases'] })
      toast({ title: 'Cas créé', description: `"${newCase.title}" a été ajouté.` })
      setDialogOpen(false)
      setNewCase({ title: '', description: '', patientId: '', facilityId: '', assignedDoctorId: '', priority: '', diagnosis: '', symptoms: '', tags: '' })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer le cas clinique.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (c: CaseItem) => {
    setEditingCase(c)
    setEditCase({
      title: (c.title as string) || '',
      description: (c.description as string) || '',
      patientId: (c.patientId as string) || '',
      facilityId: (c.facilityId as string) || '',
      assignedDoctorId: (c.assignedDoctorId as string) || (c.doctorId as string) || '',
      priority: ((c.priority as string) || 'medium') as CasePriority | '',
      diagnosis: (c.diagnosis as string) || '',
      symptoms: Array.isArray(c.symptoms) ? (c.symptoms as string[]).join(', ') : '',
      tags: Array.isArray(c.tags) ? (c.tags as string[]).join(', ') : '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdateCase = async () => {
    if (!editingCase) return
    setSaving(true)
    try {
      await updateCase.mutateAsync({
        id: editingCase.id as string,
        data: {
          title: editCase.title,
          description: editCase.description,
          patientId: sanitizeUuid(editCase.patientId),
          facilityId: sanitizeUuid(editCase.facilityId),
          doctorId: sanitizeUuid(editCase.assignedDoctorId),
          provisionalDiagnosis: editCase.diagnosis,
          symptomsJson: editCase.symptoms ? { description: editCase.symptoms } : {},
          tagsJson: editCase.tags ? { tags: editCase.tags.split(',').map((t: string) => t.trim()).filter(Boolean) } : {},
          priority: editCase.priority || 'medium',
        },
      })
      toast({ title: 'Cas mis à jour', description: `"${editCase.title}" a été modifié.` })
      setEditDialogOpen(false)
      setEditingCase(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier le cas clinique.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCase = async (c: Record<string, unknown>) => {
    const title = (c.title as string) || 'ce cas'
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ? Cette action est irréversible.`)) return
    try {
      await deleteCase.mutateAsync(c.id as string)
      toast({ title: 'Cas supprimé', description: `"${title}" a été supprimé.` })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de supprimer le cas.", variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Chargement des cas cliniques...</p>
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
            {filteredCases.length} cas trouvé{filteredCases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('consultations:create') && (
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
            <form onSubmit={(e) => { e.preventDefault(); handleCreateCase() }} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Titre *
                </label>
                <Input
                  placeholder="Titre du cas"
                  value={newCase.title}
                  onChange={(e) =>
                    setNewCase({ ...newCase, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  placeholder="Description détaillée du cas"
                  rows={3}
                  value={newCase.description}
                  onChange={(e) =>
                    setNewCase({ ...newCase, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Patient
                  </label>
                  <Select
                    value={newCase.patientId}
                    onValueChange={(v) =>
                      setNewCase({ ...newCase, patientId: v })
                    }
                  >
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Établissement
                  </label>
                  <Select
                    value={newCase.facilityId}
                    onValueChange={(v) =>
                      setNewCase({ ...newCase, facilityId: v })
                    }
                  >
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Médecin assigné
                  </label>
                  <Select
                    value={newCase.assignedDoctorId}
                    onValueChange={(v) =>
                      setNewCase({ ...newCase, assignedDoctorId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList
                        .filter((u) => u.role === 'DOCTOR')
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Priorité
                  </label>
                  <Select
                    value={newCase.priority}
                    onValueChange={(v) =>
                      setNewCase({ ...newCase, priority: v as CasePriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Diagnostic
                </label>
                <Input
                  placeholder="Diagnostic principal"
                  value={newCase.diagnosis}
                  onChange={(e) =>
                    setNewCase({ ...newCase, diagnosis: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Symptômes (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Fièvre, Toux, Douleur"
                  value={newCase.symptoms}
                  onChange={(e) =>
                    setNewCase({ ...newCase, symptoms: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Cardiologie, Urgence"
                  value={newCase.tags}
                  onChange={(e) =>
                    setNewCase({ ...newCase, tags: e.target.value })
                  }
                />
              </div>
            </form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating} onClick={handleCreateCase}>{creating ? 'Création...' : 'Créer le cas'}</Button>
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
                  value={editCase.title}
                  onChange={(e) =>
                    setEditCase({ ...editCase, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  placeholder="Description détaillée du cas"
                  rows={3}
                  value={editCase.description}
                  onChange={(e) =>
                    setEditCase({ ...editCase, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Patient
                  </label>
                  <Select
                    value={editCase.patientId}
                    onValueChange={(v) =>
                      setEditCase({ ...editCase, patientId: v })
                    }
                  >
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Établissement
                  </label>
                  <Select
                    value={editCase.facilityId}
                    onValueChange={(v) =>
                      setEditCase({ ...editCase, facilityId: v })
                    }
                  >
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Médecin assigné
                  </label>
                  <Select
                    value={editCase.assignedDoctorId}
                    onValueChange={(v) =>
                      setEditCase({ ...editCase, assignedDoctorId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList
                        .filter((u) => u.role === 'DOCTOR')
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Priorité
                  </label>
                  <Select
                    value={editCase.priority}
                    onValueChange={(v) =>
                      setEditCase({ ...editCase, priority: v as CasePriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Diagnostic
                </label>
                <Input
                  placeholder="Diagnostic principal"
                  value={editCase.diagnosis}
                  onChange={(e) =>
                    setEditCase({ ...editCase, diagnosis: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Symptômes (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Fièvre, Toux, Douleur"
                  value={editCase.symptoms}
                  onChange={(e) =>
                    setEditCase({ ...editCase, symptoms: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  placeholder="ex: Cardiologie, Urgence"
                  value={editCase.tags}
                  onChange={(e) =>
                    setEditCase({ ...editCase, tags: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={saving} onClick={handleUpdateCase}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
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

      {filteredCases.length === 0 ? (
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
          {paginatedCases.map((c) => (
            <Link key={c.id} href={`/clinical-cases/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">
                      {c.title}
                    </CardTitle>
                    {can('consultations:edit') && (
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
                    {can('consultations:delete') && (
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
              {paginatedCases.map((c) => (
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
                      {can('consultations:edit') && (
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
                      {can('consultations:delete') && (
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
    </div>
  )
}
