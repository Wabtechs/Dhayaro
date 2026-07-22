'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Brain,
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
  useDiagnosticsData,
  usePatientsData,
  useUsersData,
  useDiseasesData,
  useConsultationsData,
  useCreateDiagnostic,
  useUpdateDiagnostic,
  useDeleteDiagnostic,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

const diagnosticTypeConfig: Record<string, { label: string; color: string }> = {
  PROVISIONAL: { label: 'Provisoire', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  FINAL: { label: 'Final', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DIFFERENTIAL: { label: 'Différentiel', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
}

interface DiagnosticItem {
  id: string
  consultationId?: string
  patientId: string
  doctorId: string
  diseaseId?: string
  diagnosticType: string
  description: string
  notes?: string
  isValidated?: boolean
  validatedBy?: string
  validatedAt?: string
  createdAt: string
  updatedAt: string
  patientFirstName?: string
  patientLastName?: string
  doctorFirstName?: string
  doctorLastName?: string
  diseaseCode?: string
  diseaseName?: string
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

interface DiseaseItem {
  id: string
  code?: string
  name?: string
  [key: string]: unknown
}

interface ConsultationItem {
  id: string
  consultationNumber?: string
  [key: string]: unknown
}

export { DiagnosticsView }
export default function DiagnosticsView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [validatedFilter, setValidatedFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useDiagnosticsData()

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: diseasesData } = useDiseasesData()
  const { data: consultationsData } = useConsultationsData()

  const createDiagnostic = useCreateDiagnostic()
  const updateDiagnostic = useUpdateDiagnostic()
  const deleteDiagnostic = useDeleteDiagnostic()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const diseasesList = (diseasesData?.items ?? []) as DiseaseItem[]
  const consultationsList = (consultationsData?.items ?? []) as ConsultationItem[]

  const doctorsList = usersList.filter((u) =>
    ['doctor', 'specialist'].includes(String(u.role || '').toLowerCase())
  )

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as DiagnosticItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (typeFilter !== 'all' && item.diagnosticType !== typeFilter) return false
      if (validatedFilter === 'validated' && !item.isValidated) return false
      if (validatedFilter === 'pending' && item.isValidated) return false
      if (!search) return true
      const patientName = `${item.patientFirstName || ''} ${item.patientLastName || ''}`.toLowerCase()
      const doctorName = `${item.doctorFirstName || ''} ${item.doctorLastName || ''}`.toLowerCase()
      const diseaseName = String(item.diseaseName || '').toLowerCase()
      return (
        String(item.description || '').toLowerCase().includes(q) ||
        patientName.includes(q) ||
        doctorName.includes(q) ||
        diseaseName.includes(q)
      )
    })
  }, [data, search, typeFilter, validatedFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDiagnostic, setEditingDiagnostic] = useState<DiagnosticItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [newDiagnostic, setNewDiagnostic] = useState({
    patientId: '',
    doctorId: '',
    consultationId: '',
    diseaseId: '',
    diagnosticType: 'PROVISIONAL' as string,
    description: '',
    notes: '',
  })

  const [editForm, setEditForm] = useState({
    diagnosticType: 'PROVISIONAL' as string,
    diseaseId: '',
    description: '',
    notes: '',
    doctorId: '',
  })

  const resetNewDiagnostic = () => {
    setNewDiagnostic({
      patientId: '',
      doctorId: '',
      consultationId: '',
      diseaseId: '',
      diagnosticType: 'PROVISIONAL',
      description: '',
      notes: '',
    })
  }

  const handleCreate = async () => {
    if (!newDiagnostic.patientId || !newDiagnostic.doctorId || !newDiagnostic.consultationId || !newDiagnostic.description) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await createDiagnostic.mutateAsync({
        patientId: sanitizeUuid(newDiagnostic.patientId) as string,
        doctorId: sanitizeUuid(newDiagnostic.doctorId) as string,
        consultationId: sanitizeUuid(newDiagnostic.consultationId) as string,
        diseaseId: sanitizeUuid(newDiagnostic.diseaseId) || undefined,
        diagnosticType: newDiagnostic.diagnosticType,
        description: newDiagnostic.description,
        notes: newDiagnostic.notes || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
      toast({ title: 'Diagnostic créé', description: `"${newDiagnostic.description}" a été enregistré.` })
      setDialogOpen(false)
      resetNewDiagnostic()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le diagnostic.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (d: DiagnosticItem) => {
    setEditingDiagnostic(d)
    setEditForm({
      diagnosticType: (d.diagnosticType as string) || 'PROVISIONAL',
      diseaseId: (d.diseaseId as string) || '',
      description: (d.description as string) || '',
      notes: (d.notes as string) || '',
      doctorId: (d.doctorId as string) || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDiagnostic) return
    setSaving(true)
    try {
      await updateDiagnostic.mutateAsync({
        id: editingDiagnostic.id as string,
        data: {
          diagnosticType: editForm.diagnosticType,
          diseaseId: sanitizeUuid(editForm.diseaseId) || undefined,
          description: editForm.description,
          notes: editForm.notes || null,
          doctorId: sanitizeUuid(editForm.doctorId) || undefined,
        },
      })
      toast({ title: 'Diagnostic mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingDiagnostic(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le diagnostic.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (d: DiagnosticItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer ce diagnostic "${d.description}" ?`,
      callback: async () => {
        try {
          await deleteDiagnostic.mutateAsync(d.id as string)
          toast({ title: 'Diagnostic supprimé', description: `"${d.description}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer le diagnostic.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diagnostics</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} diagnostic{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('diagnostics:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Diagnostic
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Diagnostic</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer un nouveau diagnostic.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Select value={newDiagnostic.patientId} onValueChange={(v) => setNewDiagnostic({ ...newDiagnostic, patientId: v })}>
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
                  <label className="text-sm font-medium">Médecin *</label>
                  <Select value={newDiagnostic.doctorId} onValueChange={(v) => setNewDiagnostic({ ...newDiagnostic, doctorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsList.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation *</label>
                  <Select value={newDiagnostic.consultationId} onValueChange={(v) => setNewDiagnostic({ ...newDiagnostic, consultationId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.consultationNumber || c.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maladie</label>
                  <Select value={newDiagnostic.diseaseId} onValueChange={(v) => setNewDiagnostic({ ...newDiagnostic, diseaseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une maladie" />
                    </SelectTrigger>
                    <SelectContent>
                      {diseasesList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.code ? `${d.code} — ${d.name}` : d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select value={newDiagnostic.diagnosticType} onValueChange={(v) => setNewDiagnostic({ ...newDiagnostic, diagnosticType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROVISIONAL">Provisoire</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                    <SelectItem value="DIFFERENTIAL">Différentiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Description du diagnostic"
                  rows={3}
                  value={newDiagnostic.description}
                  onChange={(e) => setNewDiagnostic({ ...newDiagnostic, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes cliniques"
                  rows={3}
                  value={newDiagnostic.notes}
                  onChange={(e) => setNewDiagnostic({ ...newDiagnostic, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newDiagnostic.patientId || !newDiagnostic.doctorId || !newDiagnostic.consultationId || !newDiagnostic.description} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer le diagnostic'}
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
                placeholder="Rechercher un diagnostic..."
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
              <Select value={typeFilter} onValueChange={(v) => {
                setTypeFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="PROVISIONAL">Provisoire</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="DIFFERENTIAL">Différentiel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={validatedFilter} onValueChange={(v) => {
                setValidatedFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Validation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="validated">Validés</SelectItem>
                  <SelectItem value="pending">Non validés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun diagnostic disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Maladie</TableHead>
                    <TableHead>Validé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item: DiagnosticItem) => {
                    const type = String(item.diagnosticType || '').toUpperCase()
                    const typeConfig = diagnosticTypeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstName || ''} ${item.patientLastName || ''}`.trim() || '—'
                    const docName = `${item.doctorFirstName || ''} ${item.doctorLastName || ''}`.trim() || '—'
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/diagnostics/${item.id}`)}
                      >
                        <TableCell>
                          <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">
                          {String(item.description || '—')}
                        </TableCell>
                        <TableCell className="font-medium">{patientName}</TableCell>
                        <TableCell>{docName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(item.diseaseName || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isValidated
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {item.isValidated ? 'Validé' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('diagnostics:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('diagnostics:edit') && (
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
                              onClick={() => router.push(`/diagnostics/${item.id}`)}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le diagnostic</DialogTitle>
            <DialogDescription>
              Modifiez les informations du diagnostic ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select value={editForm.diagnosticType} onValueChange={(v) => setEditForm({ ...editForm, diagnosticType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROVISIONAL">Provisoire</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="DIFFERENTIAL">Différentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maladie</label>
              <Select value={editForm.diseaseId} onValueChange={(v) => setEditForm({ ...editForm, diseaseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une maladie" />
                </SelectTrigger>
                <SelectContent>
                  {diseasesList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code ? `${d.code} — ${d.name}` : d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Médecin</label>
              <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {doctorsList.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving || !editForm.description} onClick={handleUpdate}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
