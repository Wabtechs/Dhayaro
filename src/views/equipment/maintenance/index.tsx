'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate, formatNumber } from '@/lib/utils'
import { Wrench, Search, Plus, Filter, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
  useEquipmentMaintenance,
  useEquipmentItems,
  useCreateEquipmentMaintenance,
  useUpdateEquipmentMaintenance,
  useDeleteEquipmentMaintenance,
} from '@/hooks/use-equipment-data'
import { MAINTENANCE_TYPES, MAINTENANCE_STATUSES, INCIDENT_PRIORITIES } from '@/lib/api-schemas-equipment'
import type { EquipmentMaintenance } from '@/types/equipment'

const maintenanceTypeLabels: Record<string, string> = {
  PREVENTIVE: 'Préventive',
  CORRECTIVE: 'Corrective',
  INSPECTION: 'Inspection',
  CALIBRATION: 'Calibrage',
  VALIDATION: 'Validation',
  REVISION: 'Révision',
}

const maintenanceStatusLabels: Record<string, string> = {
  SCHEDULED: 'Planifiée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  OVERDUE: 'En retard',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
  URGENT: 'Urgente',
  CRITICAL: 'Critique',
}

const statusBadgeClass: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const priorityBadgeClass = (p: string) => {
  if (p === 'CRITICAL' || p === 'HIGH') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  if (p === 'MEDIUM' || p === 'URGENT') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

interface EquipmentOption {
  id: string
  name?: string
  code?: string
}

interface MaintenanceFormValues {
  equipmentId: string
  maintenanceType: string
  status: string
  priority: string
  scheduledDate: string
  startedAt: string
  completedAt: string
  technicianName: string
  company: string
  cost: string
  currency: string
  durationHours: string
  notes: string
}

const emptyForm = (): MaintenanceFormValues => ({
  equipmentId: '',
  maintenanceType: 'PREVENTIVE',
  status: 'SCHEDULED',
  priority: 'MEDIUM',
  scheduledDate: '',
  startedAt: '',
  completedAt: '',
  technicianName: '',
  company: '',
  cost: '',
  currency: 'CDF',
  durationHours: '',
  notes: '',
})

export { EquipmentMaintenanceView }
export default function EquipmentMaintenanceView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(statusFilter !== 'all' ? [`status=${statusFilter}`] : []),
    ...(typeFilter !== 'all' ? [`maintenanceType=${typeFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentMaintenance(searchParams)
  const { data: equipmentData } = useEquipmentItems('page=1&size=100')

  const createMaintenance = useCreateEquipmentMaintenance()
  const updateMaintenance = useUpdateEquipmentMaintenance()
  const deleteMaintenance = useDeleteEquipmentMaintenance()

  const items = (data?.items ?? []) as EquipmentMaintenance[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const equipmentList = (equipmentData?.items ?? []) as EquipmentOption[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<EquipmentMaintenance | null>(null)
  const [createForm, setCreateForm] = useState<MaintenanceFormValues>(emptyForm)
  const [editForm, setEditForm] = useState<MaintenanceFormValues>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  const setCreate = (field: keyof MaintenanceFormValues, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  const setEdit = (field: keyof MaintenanceFormValues, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toPayload = (f: MaintenanceFormValues) => ({
    equipmentId: f.equipmentId,
    maintenanceType: f.maintenanceType,
    status: f.status,
    priority: f.priority,
    scheduledDate: f.scheduledDate || undefined,
    startedAt: f.startedAt || undefined,
    completedAt: f.completedAt || undefined,
    technicianName: f.technicianName || undefined,
    company: f.company || undefined,
    cost: f.cost ? Number(f.cost) : undefined,
    currency: f.currency || undefined,
    durationHours: f.durationHours ? Number(f.durationHours) : undefined,
    notes: f.notes || undefined,
  })

  const handleCreate = async () => {
    if (!createForm.equipmentId) return
    setCreating(true)
    try {
      await createMaintenance.mutateAsync([toPayload(createForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-maintenance'] })
      toast({ title: 'Maintenance créée', description: 'La maintenance a été enregistrée.' })
      setDialogOpen(false)
      setCreateForm(emptyForm())
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la maintenance.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (item: EquipmentMaintenance) => {
    setEditingMaintenance(item)
    setEditForm({
      equipmentId: item.equipmentId || '',
      maintenanceType: item.maintenanceType || 'PREVENTIVE',
      status: item.status || 'SCHEDULED',
      priority: item.priority || 'MEDIUM',
      scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : '',
      startedAt: item.startedAt ? item.startedAt.slice(0, 10) : '',
      completedAt: item.completedAt ? item.completedAt.slice(0, 10) : '',
      technicianName: item.technicianName || '',
      company: item.company || '',
      cost: item.cost != null ? String(item.cost) : '',
      currency: item.currency || 'CDF',
      durationHours: item.durationHours != null ? String(item.durationHours) : '',
      notes: item.notes || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingMaintenance || !editForm.equipmentId) return
    setSaving(true)
    try {
      await updateMaintenance.mutateAsync([editingMaintenance.id, toPayload(editForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-maintenance'] })
      toast({ title: 'Maintenance mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingMaintenance(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la maintenance.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: EquipmentMaintenance) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer cette maintenance pour l'équipement "${item.equipmentName || ''}" ?`,
      callback: async () => {
        try {
          await deleteMaintenance.mutateAsync([item.id])
          toast({ title: 'Maintenance supprimée', description: 'La maintenance a été supprimée.' })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer la maintenance.', variant: 'destructive' })
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

  const displayCost = (cost?: number, currency?: string) =>
    cost != null ? `${formatNumber(cost)} ${currency || 'CDF'}` : '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenances</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} maintenance{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Maintenance
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Maintenance</DialogTitle>
              <DialogDescription>
                Renseignez les informations pour planifier une maintenance.
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
                  <label className="text-sm font-medium">Type *</label>
                  <Select value={createForm.maintenanceType} onValueChange={(v) => setCreate('maintenanceType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {maintenanceTypeLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut *</label>
                  <Select value={createForm.status} onValueChange={(v) => setCreate('status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {maintenanceStatusLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité *</label>
                  <Select value={createForm.priority} onValueChange={(v) => setCreate('priority', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_PRIORITIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {priorityLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date prévue</label>
                  <Input
                    type="date"
                    value={createForm.scheduledDate}
                    onChange={(e) => setCreate('scheduledDate', e.target.value)}
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
                    value={createForm.completedAt}
                    onChange={(e) => setCreate('completedAt', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Technicien</label>
                  <Input
                    placeholder="Nom du technicien"
                    value={createForm.technicianName}
                    onChange={(e) => setCreate('technicianName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entreprise</label>
                  <Input
                    placeholder="Entreprise prestataire"
                    value={createForm.company}
                    onChange={(e) => setCreate('company', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coût</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={createForm.cost}
                    onChange={(e) => setCreate('cost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Devise</label>
                  <Input
                    placeholder="CDF"
                    value={createForm.currency}
                    onChange={(e) => setCreate('currency', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Durée (heures)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={createForm.durationHours}
                    onChange={(e) => setCreate('durationHours', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes / rapport"
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
                  {creating ? 'Création...' : 'Créer la maintenance'}
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
                placeholder="Rechercher une maintenance..."
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
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {MAINTENANCE_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {maintenanceStatusLabels[value] || value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {MAINTENANCE_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {maintenanceTypeLabels[value] || value}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune maintenance disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Équipement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Date prévue</TableHead>
                    <TableHead>Technicien</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.equipmentName || equipmentName(item.equipmentId)}</div>
                        {item.equipmentCode && (
                          <div className="text-xs text-muted-foreground">{item.equipmentCode}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{maintenanceTypeLabels[item.maintenanceType] || item.maintenanceType || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[item.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                          {maintenanceStatusLabels[item.status] || item.status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityBadgeClass(item.priority)}>
                          {priorityLabels[item.priority] || item.priority || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{displayCost(item.cost, item.currency)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(item.scheduledDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.technicianName || '—'}</TableCell>
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
                  ))}
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
            <DialogTitle>Modifier la maintenance</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la maintenance ci-dessous.
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
                <label className="text-sm font-medium">Type *</label>
                <Select value={editForm.maintenanceType} onValueChange={(v) => setEdit('maintenanceType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {maintenanceTypeLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut *</label>
                <Select value={editForm.status} onValueChange={(v) => setEdit('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {maintenanceStatusLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité *</label>
                <Select value={editForm.priority} onValueChange={(v) => setEdit('priority', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {priorityLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date prévue</label>
                <Input
                  type="date"
                  value={editForm.scheduledDate}
                  onChange={(e) => setEdit('scheduledDate', e.target.value)}
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
                  value={editForm.completedAt}
                  onChange={(e) => setEdit('completedAt', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Technicien</label>
                <Input
                  placeholder="Nom du technicien"
                  value={editForm.technicianName}
                  onChange={(e) => setEdit('technicianName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entreprise</label>
                <Input
                  placeholder="Entreprise prestataire"
                  value={editForm.company}
                  onChange={(e) => setEdit('company', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coût</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editForm.cost}
                  onChange={(e) => setEdit('cost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input
                  placeholder="CDF"
                  value={editForm.currency}
                  onChange={(e) => setEdit('currency', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durée (heures)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editForm.durationHours}
                  onChange={(e) => setEdit('durationHours', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Notes / rapport"
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
