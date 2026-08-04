'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
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
  useEquipmentCategories,
  useCreateEquipmentCategory,
  useUpdateEquipmentCategory,
  useDeleteEquipmentCategory,
} from '@/hooks/use-equipment-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import type { EquipmentCategory } from '@/types/equipment'

interface CategoryFormState {
  name: string
  parentId: string
  icon: string
  color: string
  description: string
  isActive: boolean
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  parentId: '',
  icon: '',
  color: '#0e384c',
  description: '',
  isActive: true,
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function buildCategoryPayload(f: CategoryFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: f.name,
    isActive: f.isActive,
  }
  if (f.parentId) payload.parentId = f.parentId
  if (f.icon) payload.icon = f.icon
  if (f.color) payload.color = f.color
  if (f.description) payload.description = f.description
  return payload
}

export { EquipmentCategoriesView }
export default function EquipmentCategoriesView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentCategories(searchParams)
  const createCategory = useCreateEquipmentCategory()
  const updateCategory = useUpdateEquipmentCategory()
  const deleteCategory = useDeleteEquipmentCategory()

  const items = (data?.items ?? []) as EquipmentCategory[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM)
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

  const setField = (key: keyof CategoryFormState, value: string | boolean) => {
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
      await createCategory.mutateAsync([buildCategoryPayload(form)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-categories'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({ title: 'Catégorie créée', description: `"${form.name}" a été enregistrée.` })
      setDialogOpen(false)
      resetForm()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la catégorie.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (category: EquipmentCategory) => {
    setEditingCategory(category)
    setForm({
      name: str(category.name),
      parentId: str(category.parentId),
      icon: str(category.icon),
      color: str(category.color) || '#0e384c',
      description: str(category.description),
      isActive: category.isActive !== false,
    })
    setFormError('')
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    if (!form.name.trim()) {
      setFormError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    try {
      await updateCategory.mutateAsync([editingCategory.id, buildCategoryPayload(form)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-categories'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({ title: 'Catégorie mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingCategory(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la catégorie.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (category: EquipmentCategory) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`,
      callback: async () => {
        try {
          await deleteCategory.mutateAsync([category.id])
          await queryClient.invalidateQueries({ queryKey: ['equipment-categories'] })
          await queryClient.invalidateQueries({ queryKey: ['equipment'] })
          toast({ title: 'Catégorie supprimée', description: `"${category.name}" a été supprimée.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer la catégorie.', variant: 'destructive' })
        }
      },
    })
  }

  const parentOptions = editingCategory
    ? items.filter((c) => c.id !== editingCategory.id)
    : items

  const renderFormFields = (error?: string) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input
            placeholder="Nom de la catégorie"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Catégorie parente</Label>
          <Select
            value={form.parentId}
            onValueChange={(v) => setField('parentId', v === 'none' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {parentOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Icône</Label>
          <Input
            placeholder="Nom de l'icône"
            value={form.icon}
            onChange={(e) => setField('icon', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              className="h-9 w-12 cursor-pointer p-1"
              value={form.color}
              onChange={(e) => setField('color', e.target.value)}
            />
            <Input
              value={form.color}
              onChange={(e) => setField('color', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setField('isActive', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label>Catégorie active</Label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catégories d&apos;Équipements</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} catégorie{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Catégorie
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Créer une catégorie</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer une nouvelle catégorie.
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
                  {saving ? 'Création...' : 'Créer la catégorie'}
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
                placeholder="Rechercher une catégorie..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune catégorie disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((category) => {
                    const parent = items.find((c) => c.id === category.parentId)
                    return (
                      <TableRow
                        key={category.id}
                        className="cursor-pointer"
                        onClick={() => router.push('/equipment/items')}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {category.color && (
                              <span
                                className="inline-block h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>{parent?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.icon || '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          {category.color ? (
                            <span className="font-mono text-xs text-muted-foreground">{category.color}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {category.description || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              category.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {category.isActive ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('equipment:update') && (
                              <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {can('equipment:delete') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(category)}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie ci-dessous.
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
