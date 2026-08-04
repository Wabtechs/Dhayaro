'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEquipmentItems,
  useEquipmentCategories,
  useCreateEquipmentItem,
  useUpdateEquipmentItem,
  useDeleteEquipmentItem,
} from '@/hooks/use-equipment-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES, EQUIPMENT_STATES } from '@/lib/api-schemas-equipment'
import type { EquipmentCategory } from '@/types/equipment'

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En usage',
  MAINTENANCE: 'En maintenance',
  BROKEN: 'En panne',
  RESERVED: 'Réservé',
  OUT_OF_SERVICE: 'Hors service',
  RETIRED: 'Retiré',
  LOST: 'Perdu',
}

const STATE_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon',
  FAIR: 'Moyen',
  POOR: 'Mauvais',
  CRITICAL: 'Critique',
}

const TYPE_LABELS: Record<string, string> = {
  BIOMEDICAL: 'Biomédical',
  MEDICAL: 'Médical',
  FURNITURE: 'Mobilier',
  IT: 'Informatique',
  OTHER: 'Autre',
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  IN_USE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  MAINTENANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  BROKEN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  RESERVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  OUT_OF_SERVICE: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RETIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  LOST: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const STATE_BADGE: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  GOOD: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  FAIR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  POOR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

interface EquipmentItemRow {
  id: string
  code?: string
  name?: string
  type?: string
  state?: string
  status?: string
  categoryId?: string
  categoryName?: string
  locationName?: string
  responsibleUserName?: string
  responsibleUserLastname?: string
  manufacturer?: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: number
  currency?: string
  warrantyMonths?: number
  lifecycleYears?: number
  building?: string
  floor?: string
  department?: string
  room?: string
  position?: string
  commissioningDate?: string
  retirementDate?: string
  description?: string
  comments?: string
  createdAt?: string
  [key: string]: unknown
}

interface ItemFormState {
  code: string
  name: string
  type: string
  state: string
  status: string
  categoryId: string
  manufacturer: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: string
  warrantyMonths: string
  lifecycleYears: string
  building: string
  floor: string
  department: string
  room: string
  position: string
  description: string
  comments: string
}

const EMPTY_FORM: ItemFormState = {
  code: '',
  name: '',
  type: 'BIOMEDICAL',
  state: 'NEW',
  status: 'AVAILABLE',
  categoryId: '',
  manufacturer: '',
  brand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  purchasePrice: '',
  warrantyMonths: '',
  lifecycleYears: '',
  building: '',
  floor: '',
  department: '',
  room: '',
  position: '',
  description: '',
  comments: '',
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function numStr(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

function buildPayload(f: ItemFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: f.code,
    name: f.name,
    type: f.type,
    state: f.state,
    status: f.status,
  }
  const optionalStrings = [
    'manufacturer',
    'brand',
    'model',
    'serialNumber',
    'purchaseDate',
    'building',
    'floor',
    'department',
    'room',
    'position',
    'commissioningDate',
    'retirementDate',
    'description',
    'comments',
  ] as const
  const formAny = f as unknown as Record<string, unknown>
  for (const key of optionalStrings) {
    if (formAny[key]) payload[key] = formAny[key]
  }
  if (f.categoryId) payload.categoryId = f.categoryId
  if (f.purchasePrice !== '') payload.purchasePrice = Number(f.purchasePrice)
  if (f.warrantyMonths !== '') payload.warrantyMonths = Number(f.warrantyMonths)
  if (f.lifecycleYears !== '') payload.lifecycleYears = Number(f.lifecycleYears)
  return payload
}

interface ItemFormProps {
  form: ItemFormState
  categories: EquipmentCategory[]
  onChange: (key: keyof ItemFormState, value: string) => void
  error?: string
}

function ItemFormFields({ form, categories, onChange, error }: ItemFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input
            placeholder="Nom de l'équipement"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            placeholder="Code unique"
            value={form.code}
            onChange={(e) => onChange('code', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => onChange('type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {TYPE_LABELS[value] || value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>État</Label>
          <Select value={form.state} onValueChange={(v) => onChange('state', v)}>
            <SelectTrigger>
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_STATES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATE_LABELS[value] || value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={form.status} onValueChange={(v) => onChange('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value] || value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={form.categoryId} onValueChange={(v) => onChange('categoryId', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>N° de série</Label>
          <Input
            placeholder="N° de série"
            value={form.serialNumber}
            onChange={(e) => onChange('serialNumber', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Fabricant</Label>
          <Input value={form.manufacturer} onChange={(e) => onChange('manufacturer', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Marque</Label>
          <Input value={form.brand} onChange={(e) => onChange('brand', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Modèle</Label>
          <Input value={form.model} onChange={(e) => onChange('model', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>Date d'achat</Label>
          <Input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => onChange('purchaseDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Prix d'achat</Label>
          <Input
            type="number"
            value={form.purchasePrice}
            onChange={(e) => onChange('purchasePrice', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Garantie (mois)</Label>
          <Input
            type="number"
            value={form.warrantyMonths}
            onChange={(e) => onChange('warrantyMonths', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Durée de vie (ans)</Label>
          <Input
            type="number"
            value={form.lifecycleYears}
            onChange={(e) => onChange('lifecycleYears', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="space-y-2">
          <Label>Bâtiment</Label>
          <Input value={form.building} onChange={(e) => onChange('building', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Étage</Label>
          <Input value={form.floor} onChange={(e) => onChange('floor', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Département</Label>
          <Input value={form.department} onChange={(e) => onChange('department', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Salle</Label>
          <Input value={form.room} onChange={(e) => onChange('room', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Emplacement</Label>
          <Input value={form.position} onChange={(e) => onChange('position', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Commentaires</Label>
        <Textarea
          rows={2}
          value={form.comments}
          onChange={(e) => onChange('comments', e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export { EquipmentItemsView }
export default function EquipmentItemsView() {
  const router = useRouter()
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
    ...(typeFilter !== 'all' ? [`type=${typeFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentItems(searchParams)
  const { data: categoriesData } = useEquipmentCategories()

  const createItem = useCreateEquipmentItem()
  const updateItem = useUpdateEquipmentItem()
  const deleteItem = useDeleteEquipmentItem()

  const items = (data?.items ?? []) as EquipmentItemRow[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const categories = (categoriesData?.items ?? []) as EquipmentCategory[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EquipmentItemRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  if (!can('equipment:view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ShieldAlert className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Accès non autorisé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous n&apos;avez pas la permission de consulter le module des équipements médicaux.
        </p>
      </div>
    )
  }

  const setField = (key: keyof ItemFormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    try {
      await createItem.mutateAsync([buildPayload(form)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-items'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({ title: 'Équipement créé', description: `"${form.name}" a été enregistré.` })
      setDialogOpen(false)
      resetForm()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer l’équipement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item: EquipmentItemRow) => {
    setEditingItem(item)
    setForm({
      code: str(item.code),
      name: str(item.name),
      type: str(item.type) || 'BIOMEDICAL',
      state: str(item.state) || 'NEW',
      status: str(item.status) || 'AVAILABLE',
      categoryId: str(item.categoryId),
      manufacturer: str(item.manufacturer),
      brand: str(item.brand),
      model: str(item.model),
      serialNumber: str(item.serialNumber),
      purchaseDate: str(item.purchaseDate),
      purchasePrice: numStr(item.purchasePrice),
      warrantyMonths: numStr(item.warrantyMonths),
      lifecycleYears: numStr(item.lifecycleYears),
      building: str(item.building),
      floor: str(item.floor),
      department: str(item.department),
      room: str(item.room),
      position: str(item.position),
      description: str(item.description),
      comments: str(item.comments),
    })
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    if (!form.name.trim()) {
      setFormError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    try {
      await updateItem.mutateAsync([editingItem.id, buildPayload(form)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-items'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment-item'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({ title: 'Équipement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingItem(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier l’équipement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: EquipmentItemRow) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer l’équipement "${item.name}" ?`,
      callback: async () => {
        try {
          await deleteItem.mutateAsync([item.id])
          await queryClient.invalidateQueries({ queryKey: ['equipment-items'] })
          await queryClient.invalidateQueries({ queryKey: ['equipment'] })
          toast({ title: 'Équipement supprimé', description: `"${item.name}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer l’équipement.', variant: 'destructive' })
        }
      },
    })
  }

  const renderFormFields = (error?: string) => (
    <ItemFormFields
      form={form}
      categories={categories}
      onChange={setField}
      error={error}
    />
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Boxes className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Équipements Médicaux</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} équipement{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Équipement
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un équipement</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer un nouvel équipement.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreate()
              }}
              className="grid gap-4 py-4"
            >
              {renderFormFields(formError)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Création...' : 'Créer l’équipement'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un équipement..."
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
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {EQUIPMENT_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value] || value}
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {EQUIPMENT_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TYPE_LABELS[value] || value}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun équipement disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const typeLabel = TYPE_LABELS[String(item.type || '')] || String(item.type || '—')
                    const statusLabel = STATUS_LABELS[String(item.status || '')] || String(item.status || '—')
                    const stateLabel = STATE_LABELS[String(item.state || '')] || String(item.state || '—')
                    const responsibleName = `${item.responsibleUserName || ''} ${item.responsibleUserLastname || ''}`.trim()
                    const locationName = item.locationName
                      ? String(item.locationName)
                      : [item.building, item.floor, item.department, item.room]
                          .filter(Boolean)
                          .join(' / ')
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/equipment/items/${item.id}`)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(item.code || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.name || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeLabel}</Badge>
                        </TableCell>
                        <TableCell>
                          {String(item.categoryName || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE[String(item.status || '')] || ''}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATE_BADGE[String(item.state || '')] || ''}>
                            {stateLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {locationName || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
            <DialogTitle>Modifier l&apos;équipement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;équipement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdate()
            }}
            className="grid gap-4 py-4"
          >
            {renderFormFields(formError)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
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
