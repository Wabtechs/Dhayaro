'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bug,
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
  useDiseasesData,
  useCreateDisease,
  useUpdateDisease,
  useDeleteDisease,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'

const ITEMS_PER_PAGE = 10

const severityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' },
  MODERATE: { label: 'Modérée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  CRITICAL: { label: 'Critique', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const commaSplit = (str?: string) =>
  str ? str.split(',').map((s) => s.trim()).filter(Boolean) : []
const commaJoin = (arr?: string[]) => (arr || []).join(', ')

interface DiseaseItem {
  id: string
  code: string
  name: string
  category: string
  description?: string
  symptoms: string[]
  complications: string[]
  treatments: string[]
  isContagious?: boolean
  severity?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

interface DiseaseForm {
  code: string
  name: string
  category: string
  description: string
  severity: string
  isContagious: boolean
  symptoms: string
  complications: string
  treatments: string
}

const emptyForm: DiseaseForm = {
  code: '',
  name: '',
  category: '',
  description: '',
  severity: 'MODERATE',
  isContagious: false,
  symptoms: '',
  complications: '',
  treatments: '',
}

export { DiseasesView }
export default function DiseasesView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const params = [
    search ? `search=${encodeURIComponent(search)}` : '',
    categoryFilter ? `category=${encodeURIComponent(categoryFilter)}` : '',
    'size=1000',
  ].filter(Boolean).join('&')

  const { data, isLoading } = useDiseasesData(params || '')

  const createDisease = useCreateDisease()
  const updateDisease = useUpdateDisease()
  const deleteDisease = useDeleteDisease()

  const diseasesList = useMemo(
    () => (data?.items ?? []) as DiseaseItem[],
    [data]
  )

  const totalPages = Math.max(1, Math.ceil(diseasesList.length / ITEMS_PER_PAGE))
  const paginated = diseasesList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDisease, setEditingDisease] = useState<DiseaseItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [newDisease, setNewDisease] = useState<DiseaseForm>(emptyForm)
  const [editForm, setEditForm] = useState<DiseaseForm>(emptyForm)

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createDisease.mutateAsync({
        code: newDisease.code,
        name: newDisease.name,
        category: newDisease.category,
        description: newDisease.description || null,
        severity: newDisease.severity,
        isContagious: newDisease.isContagious,
        symptoms: commaSplit(newDisease.symptoms),
        complications: commaSplit(newDisease.complications),
        treatments: commaSplit(newDisease.treatments),
      } as unknown as Record<string, unknown>)
      await queryClient.invalidateQueries({ queryKey: ['diseases'] })
      toast({ title: 'Maladie créée', description: `"${newDisease.name}" a été enregistrée.` })
      setDialogOpen(false)
      setNewDisease(emptyForm)
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la maladie.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (d: DiseaseItem) => {
    setEditingDisease(d)
    setEditForm({
      code: d.code,
      name: d.name,
      category: d.category,
      description: d.description || '',
      severity: d.severity || 'MODERATE',
      isContagious: Boolean(d.isContagious),
      symptoms: commaJoin(d.symptoms),
      complications: commaJoin(d.complications),
      treatments: commaJoin(d.treatments),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDisease) return
    setSaving(true)
    try {
      await updateDisease.mutateAsync({
        id: editingDisease.id,
        data: {
          code: editForm.code,
          name: editForm.name,
          category: editForm.category,
          description: editForm.description || null,
          severity: editForm.severity,
          isContagious: editForm.isContagious,
          symptoms: commaSplit(editForm.symptoms),
          complications: commaSplit(editForm.complications),
          treatments: commaSplit(editForm.treatments),
        } as unknown as Record<string, unknown>,
      })
      toast({ title: 'Maladie mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingDisease(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la maladie.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (d: DiseaseItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer la maladie "${d.name}" (${d.code}) ?`,
      callback: async () => {
        try {
          await deleteDisease.mutateAsync(d.id)
          toast({ title: 'Maladie supprimée', description: `"${d.name}" a été supprimée.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer la maladie.', variant: 'destructive' })
        }
      },
    })
  }

  const renderForm = (form: DiseaseForm, setForm: (f: DiseaseForm) => void) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Code *</label>
          <Input
            placeholder="Ex: A09"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Nom *</label>
          <Input
            placeholder="Nom de la maladie"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Catégorie *</label>
        <Input
          placeholder="Ex: Infectieuse"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Description clinique"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sévérité</label>
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Faible</SelectItem>
              <SelectItem value="MODERATE">Modérée</SelectItem>
              <SelectItem value="HIGH">Élevée</SelectItem>
              <SelectItem value="CRITICAL">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isContagious}
              onChange={(e) => setForm({ ...form, isContagious: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Contagieux
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Symptômes (séparés par des virgules)</label>
        <Input
          placeholder="Ex: Fièvre, Toux"
          value={form.symptoms}
          onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Complications (séparés par des virgules)</label>
        <Input
          placeholder="Ex: Déshydratation, Choc"
          value={form.complications}
          onChange={(e) => setForm({ ...form, complications: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Traitements (séparés par des virgules)</label>
        <Input
          placeholder="Ex: Hydratation, Antibiotiques"
          value={form.treatments}
          onChange={(e) => setForm({ ...form, treatments: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Bug className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maladies</h1>
            <p className="text-sm text-muted-foreground">
              {diseasesList.length} maladie{diseasesList.length > 1 ? 's' : ''} référencée{diseasesList.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('diseases:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Maladie
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Maladie</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer une nouvelle maladie de référence.
              </DialogDescription>
            </DialogHeader>
            {renderForm(newDisease, setNewDisease)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newDisease.code || !newDisease.name || !newDisease.category} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer la maladie'}
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
                placeholder="Rechercher une maladie..."
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
              <Input
                placeholder="Catégorie"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-[160px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune maladie disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Contagieux</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item: DiseaseItem) => {
                    const severity = String(item.severity || '').toUpperCase()
                    const config = severityConfig[severity] || { label: severity || '—', color: 'bg-gray-100 text-gray-700' }
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/diseases/${item.id}`)}
                      >
                        <TableCell className="font-mono text-sm font-medium">
                          {String(item.code || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.name || '—')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(item.category || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isContagious
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300'
                            }
                          >
                            {item.isContagious ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isActive !== false
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300'
                            }
                          >
                            {item.isActive !== false ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('diseases:create') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {can('diseases:create') && (
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
                              onClick={() => router.push(`/diseases/${item.id}`)}
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
            <DialogTitle>Modifier la maladie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la maladie ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {renderForm(editForm, setEditForm)}
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
