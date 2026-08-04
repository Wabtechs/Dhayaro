'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { MapPin, Search, Plus, Filter, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
  useEquipmentLocations,
  useCreateEquipmentLocation,
  useUpdateEquipmentLocation,
  useDeleteEquipmentLocation,
} from '@/hooks/use-equipment-data'
import { LOCATION_TYPES } from '@/lib/api-schemas-equipment'
import type { EquipmentLocation } from '@/types/equipment'

const locationTypeLabels: Record<string, string> = {
  FACILITY: 'Établissement',
  BUILDING: 'Bâtiment',
  FLOOR: 'Étage',
  DEPARTMENT: 'Département',
  ROOM: 'Salle',
  POSITION: 'Position',
}

interface LocationFormValues {
  type: string
  name: string
  code: string
  parentId: string
  building: string
  floor: string
  department: string
  room: string
  position: string
  description: string
  isActive: boolean
}

const emptyForm = (): LocationFormValues => ({
  type: 'DEPARTMENT',
  name: '',
  code: '',
  parentId: '',
  building: '',
  floor: '',
  department: '',
  room: '',
  position: '',
  description: '',
  isActive: true,
})

export { EquipmentLocationsView }
export default function EquipmentLocationsView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(typeFilter !== 'all' ? [`type=${typeFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentLocations(searchParams)
  const { data: allLocationsData } = useEquipmentLocations('page=1&size=100')

  const createLocation = useCreateEquipmentLocation()
  const updateLocation = useUpdateEquipmentLocation()
  const deleteLocation = useDeleteEquipmentLocation()

  const items = (data?.items ?? []) as EquipmentLocation[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const locationsList = (allLocationsData?.items ?? []) as EquipmentLocation[]

  const parentName = (id?: string) => {
    if (!id) return '—'
    return locationsList.find((l) => l.id === id)?.name || '—'
  }

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingLocation, setEditingLocation] = useState<EquipmentLocation | null>(null)
  const [createForm, setCreateForm] = useState<LocationFormValues>(emptyForm)
  const [editForm, setEditForm] = useState<LocationFormValues>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  const setCreate = (field: keyof LocationFormValues, value: string | boolean) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  const setEdit = (field: keyof LocationFormValues, value: string | boolean) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toPayload = (f: LocationFormValues) => ({
    type: f.type,
    name: f.name,
    code: f.code || undefined,
    parentId: f.parentId || undefined,
    building: f.building || undefined,
    floor: f.floor || undefined,
    department: f.department || undefined,
    room: f.room || undefined,
    position: f.position || undefined,
    description: f.description || undefined,
    isActive: f.isActive,
  })

  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    setCreating(true)
    try {
      await createLocation.mutateAsync([toPayload(createForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-locations'] })
      toast({ title: 'Emplacement créé', description: `"${createForm.name}" a été enregistré.` })
      setDialogOpen(false)
      setCreateForm(emptyForm())
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'emplacement.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (loc: EquipmentLocation) => {
    setEditingLocation(loc)
    setEditForm({
      type: loc.type || 'DEPARTMENT',
      name: loc.name || '',
      code: loc.code || '',
      parentId: loc.parentId || '',
      building: loc.building || '',
      floor: loc.floor || '',
      department: loc.department || '',
      room: loc.room || '',
      position: loc.position || '',
      description: loc.description || '',
      isActive: loc.isActive ?? true,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingLocation || !editForm.name.trim()) return
    setSaving(true)
    try {
      await updateLocation.mutateAsync([editingLocation.id, toPayload(editForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-locations'] })
      toast({ title: 'Emplacement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingLocation(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'emplacement.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (loc: EquipmentLocation) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer l'emplacement "${loc.name}" ?`,
      callback: async () => {
        try {
          await deleteLocation.mutateAsync([loc.id])
          toast({ title: 'Emplacement supprimé', description: `"${loc.name}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: "Impossible de supprimer l'emplacement.", variant: 'destructive' })
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

  const typeLabel = (t?: string) => (t ? locationTypeLabels[t] || t : '—')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Emplacements</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} emplacement{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Emplacement
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Emplacement</DialogTitle>
              <DialogDescription>
                Renseignez les informations pour enregistrer un nouvel emplacement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select value={createForm.type} onValueChange={(v) => setCreate('type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {locationTypeLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    placeholder="Nom de l'emplacement"
                    value={createForm.name}
                    onChange={(e) => setCreate('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code</label>
                  <Input
                    placeholder="Code"
                    value={createForm.code}
                    onChange={(e) => setCreate('code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emplacement parent</label>
                  <Select value={createForm.parentId} onValueChange={(v) => setCreate('parentId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {locationsList.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bâtiment</label>
                  <Input
                    placeholder="Bâtiment"
                    value={createForm.building}
                    onChange={(e) => setCreate('building', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Étage</label>
                  <Input
                    placeholder="Étage"
                    value={createForm.floor}
                    onChange={(e) => setCreate('floor', e.target.value)}
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
                  <label className="text-sm font-medium">Salle</label>
                  <Input
                    placeholder="Salle"
                    value={createForm.room}
                    onChange={(e) => setCreate('room', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    placeholder="Position"
                    value={createForm.position}
                    onChange={(e) => setCreate('position', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description de l'emplacement"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreate('description', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreate('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="text-sm font-medium">Actif</label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleCreate} disabled={creating || !createForm.name.trim()}>
                  {creating ? 'Création...' : "Créer l'emplacement"}
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
                placeholder="Rechercher un emplacement..."
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
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {LOCATION_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {locationTypeLabels[value] || value}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun emplacement disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Bâtiment</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Salle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{typeLabel(item.type)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.code || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{parentName(item.parentId)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.building || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.department || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.room || '—'}</TableCell>
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
            <DialogTitle>Modifier l'emplacement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'emplacement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select value={editForm.type} onValueChange={(v) => setEdit('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {locationTypeLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  placeholder="Nom de l'emplacement"
                  value={editForm.name}
                  onChange={(e) => setEdit('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input
                  placeholder="Code"
                  value={editForm.code}
                  onChange={(e) => setEdit('code', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Emplacement parent</label>
                <Select value={editForm.parentId} onValueChange={(v) => setEdit('parentId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {locationsList.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bâtiment</label>
                <Input
                  placeholder="Bâtiment"
                  value={editForm.building}
                  onChange={(e) => setEdit('building', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Étage</label>
                <Input
                  placeholder="Étage"
                  value={editForm.floor}
                  onChange={(e) => setEdit('floor', e.target.value)}
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
                <label className="text-sm font-medium">Salle</label>
                <Input
                  placeholder="Salle"
                  value={editForm.room}
                  onChange={(e) => setEdit('room', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input
                  placeholder="Position"
                  value={editForm.position}
                  onChange={(e) => setEdit('position', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Description de l'emplacement"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEdit('description', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEdit('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Actif</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={saving || !editForm.name.trim()}>
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
