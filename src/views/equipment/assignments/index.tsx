'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { UserCheck, Search, Plus, Filter, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEquipmentAssignments,
  useEquipmentItems,
  useCreateEquipmentAssignment,
  useUpdateEquipmentAssignment,
  useDeleteEquipmentAssignment,
} from '@/hooks/use-equipment-data'
import { ASSIGNMENT_TYPES } from '@/lib/api-schemas-equipment'
import type { EquipmentAssignment } from '@/types/equipment'

const assignmentTypeLabels: Record<string, string> = {
  DOCTOR: 'Médecin',
  NURSE: 'Infirmier',
  TECHNICIAN: 'Technicien',
  DEPARTMENT: 'Département',
  SERVICE: 'Service',
  OTHER: 'Autre',
}

interface EquipmentOption {
  id: string
  name?: string
  code?: string
}

interface AssignmentFormValues {
  equipmentId: string
  assignedToType: string
  assignedToName: string
  department: string
  startedAt: string
  endedAt: string
  notes: string
}

const emptyForm = (): AssignmentFormValues => ({
  equipmentId: '',
  assignedToType: 'DEPARTMENT',
  assignedToName: '',
  department: '',
  startedAt: '',
  endedAt: '',
  notes: '',
})

export { EquipmentAssignmentsView }
export default function EquipmentAssignmentsView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(equipmentFilter !== 'all' ? [`equipmentId=${equipmentFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentAssignments(searchParams)
  const { data: equipmentData } = useEquipmentItems('page=1&size=100')

  const createAssignment = useCreateEquipmentAssignment()
  const updateAssignment = useUpdateEquipmentAssignment()
  const deleteAssignment = useDeleteEquipmentAssignment()

  const items = (data?.items ?? []) as EquipmentAssignment[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const equipmentList = (equipmentData?.items ?? []) as EquipmentOption[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<EquipmentAssignment | null>(null)
  const [createForm, setCreateForm] = useState<AssignmentFormValues>(emptyForm)
  const [editForm, setEditForm] = useState<AssignmentFormValues>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  const setCreate = (field: keyof AssignmentFormValues, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  const setEdit = (field: keyof AssignmentFormValues, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toPayload = (f: AssignmentFormValues) => ({
    equipmentId: f.equipmentId,
    assignedToType: f.assignedToType,
    assignedToName: f.assignedToName || undefined,
    department: f.department || undefined,
    startedAt: f.startedAt || undefined,
    endedAt: f.endedAt || undefined,
    notes: f.notes || undefined,
  })

  const handleCreate = async () => {
    if (!createForm.equipmentId) return
    setCreating(true)
    try {
      await createAssignment.mutateAsync([toPayload(createForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] })
      toast({ title: 'Affectation créée', description: "L'affectation a été enregistrée." })
      setDialogOpen(false)
      setCreateForm(emptyForm())
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'affectation.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (item: EquipmentAssignment) => {
    setEditingAssignment(item)
    setEditForm({
      equipmentId: item.equipmentId || '',
      assignedToType: item.assignedToType || 'DEPARTMENT',
      assignedToName: item.assignedToName || '',
      department: item.department || '',
      startedAt: item.startedAt ? item.startedAt.slice(0, 10) : '',
      endedAt: item.endedAt ? item.endedAt.slice(0, 10) : '',
      notes: item.notes || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingAssignment || !editForm.equipmentId) return
    setSaving(true)
    try {
      await updateAssignment.mutateAsync([editingAssignment.id, toPayload(editForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] })
      toast({ title: 'Affectation mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingAssignment(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'affectation.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: EquipmentAssignment) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer cette affectation de l'équipement "${item.equipmentName || ''}" ?`,
      callback: async () => {
        try {
          await deleteAssignment.mutateAsync([item.id])
          toast({ title: 'Affectation supprimée', description: "L'affectation a été supprimée." })
        } catch {
          toast({ title: 'Erreur', description: "Impossible de supprimer l'affectation.", variant: 'destructive' })
        }
      },
    })
  }

  if (!can('equipment:view')) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Accès non autorisé</p>
        </CardContent>
      </Card>
    )
  }

  const equipmentName = (id?: string) => {
    if (!id) return '—'
    return equipmentList.find((e) => e.id === id)?.name || '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affectations</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} affectation{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Affectation
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Affectation</DialogTitle>
              <DialogDescription>
                Renseignez les informations pour affecter un équipement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Équipement *</label>
                  <Select value={createForm.equipmentId} onValueChange={(v) => setCreate('equipmentId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un équipement" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentList.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type d'affectation *</label>
                  <Select value={createForm.assignedToType} onValueChange={(v) => setCreate('assignedToType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNMENT_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {assignmentTypeLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Affecté à</label>
                  <Input
                    placeholder="Nom du bénéficiaire"
                    value={createForm.assignedToName}
                    onChange={(e) => setCreate('assignedToName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Département</label>
                  <Input
                    placeholder="Département"
                    value={createForm.department}
                    onChange={(e) => setCreate('department', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Début</label>
                  <Input
                    type="date"
                    value={createForm.startedAt}
                    onChange={(e) => setCreate('startedAt', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fin</label>
                  <Input
                    type="date"
                    value={createForm.endedAt}
                    onChange={(e) => setCreate('endedAt', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes"
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreate('notes', e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleCreate} disabled={creating || !createForm.equipmentId}>
                  {creating ? 'Création...' : "Créer l'affectation"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une affectation..."
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
              <Select
                value={equipmentFilter}
                onValueChange={(v) => {
                  setEquipmentFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Équipement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {equipmentList.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
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
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune affectation disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Équipement</TableHead>
                    <TableHead>Affecté à</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const active = !item.endedAt
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.equipmentName || equipmentName(item.equipmentId)}</TableCell>
                        <TableCell className="text-sm">{item.assignedToName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignmentTypeLabels[item.assignedToType] || item.assignedToType || '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.department || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(item.startedAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(item.endedAt)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {active ? 'Actif' : 'Clôturé'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {can('equipment:update') && (
                              <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {can('equipment:delete') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
            <DialogTitle>Modifier l'affectation</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'affectation ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Équipement *</label>
                <Select value={editForm.equipmentId} onValueChange={(v) => setEdit('equipmentId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentList.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'affectation *</label>
                <Select value={editForm.assignedToType} onValueChange={(v) => setEdit('assignedToType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {assignmentTypeLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Affecté à</label>
                <Input
                  placeholder="Nom du bénéficiaire"
                  value={editForm.assignedToName}
                  onChange={(e) => setEdit('assignedToName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Département</label>
                <Input
                  placeholder="Département"
                  value={editForm.department}
                  onChange={(e) => setEdit('department', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Début</label>
                <Input
                  type="date"
                  value={editForm.startedAt}
                  onChange={(e) => setEdit('startedAt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin</label>
                <Input
                  type="date"
                  value={editForm.endedAt}
                  onChange={(e) => setEdit('endedAt', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Notes"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEdit('notes', e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={saving || !editForm.equipmentId}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </div>
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
