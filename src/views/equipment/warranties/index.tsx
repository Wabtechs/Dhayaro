'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { ShieldCheck, Search, Plus, Filter, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
  useEquipmentWarranties,
  useEquipmentItems,
  useEquipmentSuppliers,
  useCreateEquipmentWarranty,
  useUpdateEquipmentWarranty,
  useDeleteEquipmentWarranty,
} from '@/hooks/use-equipment-data'
import { WARRANTY_STATUSES } from '@/lib/api-schemas-equipment'
import type { EquipmentWarranty } from '@/types/equipment'

const warrantyStatusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  CLAIMED: 'En réclamation',
}

const warrantyBadgeClass: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CLAIMED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

interface EquipmentOption {
  id: string
  name?: string
  code?: string
}

interface SupplierOption {
  id: string
  name?: string
}

interface WarrantyFormValues {
  equipmentId: string
  supplierId: string
  startDate: string
  endDate: string
  status: string
  coverage: string
  cost: string
  notes: string
}

const emptyForm = (): WarrantyFormValues => ({
  equipmentId: '',
  supplierId: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  coverage: '',
  cost: '',
  notes: '',
})

const daysLeft = (endDate?: string): number | null => {
  if (!endDate) return null
  const end = new Date(endDate).getTime()
  if (isNaN(end)) return null
  return Math.ceil((end - Date.now()) / 86400000)
}

export { EquipmentWarrantiesView }
export default function EquipmentWarrantiesView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(statusFilter !== 'all' ? [`status=${statusFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentWarranties(searchParams)
  const { data: equipmentData } = useEquipmentItems('page=1&size=100')
  const { data: suppliersData } = useEquipmentSuppliers('page=1&size=100')

  const createWarranty = useCreateEquipmentWarranty()
  const updateWarranty = useUpdateEquipmentWarranty()
  const deleteWarranty = useDeleteEquipmentWarranty()

  const items = (data?.items ?? []) as EquipmentWarranty[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const equipmentList = (equipmentData?.items ?? []) as EquipmentOption[]
  const suppliersList = (suppliersData?.items ?? []) as SupplierOption[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingWarranty, setEditingWarranty] = useState<EquipmentWarranty | null>(null)
  const [createForm, setCreateForm] = useState<WarrantyFormValues>(emptyForm)
  const [editForm, setEditForm] = useState<WarrantyFormValues>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  const setCreate = (field: keyof WarrantyFormValues, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  const setEdit = (field: keyof WarrantyFormValues, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toPayload = (f: WarrantyFormValues) => ({
    equipmentId: f.equipmentId,
    supplierId: f.supplierId || undefined,
    startDate: f.startDate || undefined,
    endDate: f.endDate,
    status: f.status,
    coverage: f.coverage || undefined,
    cost: f.cost ? Number(f.cost) : undefined,
    notes: f.notes || undefined,
  })

  const handleCreate = async () => {
    if (!createForm.equipmentId || !createForm.endDate) return
    setCreating(true)
    try {
      await createWarranty.mutateAsync([toPayload(createForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-warranties'] })
      toast({ title: 'Garantie créée', description: 'La garantie a été enregistrée.' })
      setDialogOpen(false)
      setCreateForm(emptyForm())
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la garantie.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (item: EquipmentWarranty) => {
    setEditingWarranty(item)
    setEditForm({
      equipmentId: item.equipmentId || '',
      supplierId: item.supplierId || '',
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
      status: item.status || 'ACTIVE',
      coverage: item.coverage || '',
      cost: item.cost != null ? String(item.cost) : '',
      notes: item.notes || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingWarranty || !editForm.equipmentId || !editForm.endDate) return
    setSaving(true)
    try {
      await updateWarranty.mutateAsync([editingWarranty.id, toPayload(editForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-warranties'] })
      toast({ title: 'Garantie mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingWarranty(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la garantie.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: EquipmentWarranty) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer la garantie de l'équipement "${item.equipmentName || ''}" ?`,
      callback: async () => {
        try {
          await deleteWarranty.mutateAsync([item.id])
          toast({ title: 'Garantie supprimée', description: 'La garantie a été supprimée.' })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer la garantie.', variant: 'destructive' })
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

  const renderDays = (d: number | null) => {
    if (d === null) return <span className="text-sm text-muted-foreground">—</span>
    if (d > 0) return <span className="text-sm text-emerald-600 dark:text-emerald-400">{d} j restants</span>
    if (d < 0) return <span className="text-sm text-red-600 dark:text-red-400">{Math.abs(d)} j expirés</span>
    return <span className="text-sm text-amber-600 dark:text-amber-400">Dernier jour</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Garanties</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} garantie{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Garantie
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Garantie</DialogTitle>
              <DialogDescription>
                Renseignez les informations pour enregistrer une garantie.
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
                  <label className="text-sm font-medium">Fournisseur</label>
                  <Select value={createForm.supplierId} onValueChange={(v) => setCreate('supplierId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {suppliersList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Début</label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreate('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fin *</label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreate('endDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut *</label>
                  <Select value={createForm.status} onValueChange={(v) => setCreate('status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {WARRANTY_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {warrantyStatusLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Couverture</label>
                  <Input
                    placeholder="Couverture"
                    value={createForm.coverage}
                    onChange={(e) => setCreate('coverage', e.target.value)}
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
                <Button type="button" onClick={handleCreate} disabled={creating || !createForm.equipmentId || !createForm.endDate}>
                  {creating ? 'Création...' : 'Créer la garantie'}
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
                placeholder="Rechercher une garantie..."
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {WARRANTY_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {warrantyStatusLabels[value] || value}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune garantie disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Équipement</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Jours restants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.equipmentName || equipmentName(item.equipmentId)}</TableCell>
                      <TableCell className="text-sm">{item.supplierName || '—'}</TableCell>
                      <TableCell>
                        <Badge className={warrantyBadgeClass[item.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                          {warrantyStatusLabels[item.status] || item.status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(item.startDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(item.endDate)}</TableCell>
                      <TableCell>{renderDays(daysLeft(item.endDate))}</TableCell>
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
            <DialogTitle>Modifier la garantie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la garantie ci-dessous.
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
                <label className="text-sm font-medium">Fournisseur</label>
                <Select value={editForm.supplierId} onValueChange={(v) => setEdit('supplierId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {suppliersList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Début</label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEdit('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin *</label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEdit('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut *</label>
                <Select value={editForm.status} onValueChange={(v) => setEdit('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARRANTY_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {warrantyStatusLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Couverture</label>
                <Input
                  placeholder="Couverture"
                  value={editForm.coverage}
                  onChange={(e) => setEdit('coverage', e.target.value)}
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
              <Button type="button" onClick={handleUpdate} disabled={saving || !editForm.equipmentId || !editForm.endDate}>
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
