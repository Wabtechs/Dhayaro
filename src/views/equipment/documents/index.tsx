'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { FileText, Search, Plus, Filter, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
  useEquipmentDocuments,
  useEquipmentItems,
  useCreateEquipmentDocument,
  useUpdateEquipmentDocument,
  useDeleteEquipmentDocument,
} from '@/hooks/use-equipment-data'
import { EQUIPMENT_DOC_CATEGORIES } from '@/lib/api-schemas-equipment'
import type { EquipmentDocument } from '@/types/equipment'

const docCategoryLabels: Record<string, string> = {
  INVOICE: 'Facture',
  CONTRACT: 'Contrat',
  WARRANTY: 'Garantie',
  MANUAL: 'Manuel',
  REPORT: 'Rapport',
  CERTIFICATE: 'Certificat',
  PHOTO: 'Photo',
  OTHER: 'Autre',
}

interface EquipmentOption {
  id: string
  name?: string
  code?: string
}

interface DocumentFormValues {
  equipmentId: string
  title: string
  category: string
  filePath: string
  fileType: string
  fileSize: string
  description: string
}

const emptyForm = (): DocumentFormValues => ({
  equipmentId: '',
  title: '',
  category: 'OTHER',
  filePath: '',
  fileType: '',
  fileSize: '',
  description: '',
})

export { EquipmentDocumentsView }
export default function EquipmentDocumentsView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [equipmentFilter, setEquipmentFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(equipmentFilter !== 'all' ? [`equipmentId=${equipmentFilter}`] : []),
    ...(categoryFilter !== 'all' ? [`category=${categoryFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useEquipmentDocuments(searchParams)
  const { data: equipmentData } = useEquipmentItems('page=1&size=100')

  const createDocument = useCreateEquipmentDocument()
  const updateDocument = useUpdateEquipmentDocument()
  const deleteDocument = useDeleteEquipmentDocument()

  const items = (data?.items ?? []) as (EquipmentDocument & { equipmentName?: string })[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const equipmentList = (equipmentData?.items ?? []) as EquipmentOption[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDocument, setEditingDocument] = useState<EquipmentDocument | null>(null)
  const [createForm, setCreateForm] = useState<DocumentFormValues>(emptyForm)
  const [editForm, setEditForm] = useState<DocumentFormValues>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  const setCreate = (field: keyof DocumentFormValues, value: string) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  const setEdit = (field: keyof DocumentFormValues, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toPayload = (f: DocumentFormValues) => ({
    equipmentId: f.equipmentId,
    title: f.title,
    category: f.category,
    filePath: f.filePath || undefined,
    fileType: f.fileType || undefined,
    fileSize: f.fileSize ? Number(f.fileSize) : undefined,
    description: f.description || undefined,
  })

  const handleCreate = async () => {
    if (!createForm.equipmentId || !createForm.title.trim()) return
    setCreating(true)
    try {
      await createDocument.mutateAsync([toPayload(createForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-documents'] })
      toast({ title: 'Document créé', description: `"${createForm.title}" a été enregistré.` })
      setDialogOpen(false)
      setCreateForm(emptyForm())
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le document.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (item: EquipmentDocument) => {
    setEditingDocument(item)
    setEditForm({
      equipmentId: item.equipmentId || '',
      title: item.title || '',
      category: item.category || 'OTHER',
      filePath: item.filePath || '',
      fileType: item.fileType || '',
      fileSize: item.fileSize != null ? String(item.fileSize) : '',
      description: item.description || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDocument || !editForm.equipmentId || !editForm.title.trim()) return
    setSaving(true)
    try {
      await updateDocument.mutateAsync([editingDocument.id, toPayload(editForm)])
      await queryClient.invalidateQueries({ queryKey: ['equipment-documents'] })
      toast({ title: 'Document mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingDocument(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le document.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: EquipmentDocument) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer le document "${item.title}" ?`,
      callback: async () => {
        try {
          await deleteDocument.mutateAsync([item.id])
          toast({ title: 'Document supprimé', description: `"${item.title}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer le document.', variant: 'destructive' })
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
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} document{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('equipment:create') && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Document
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Document</DialogTitle>
              <DialogDescription>
                Renseignez les informations pour enregistrer un document d'équipement.
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
                  <label className="text-sm font-medium">Catégorie *</label>
                  <Select value={createForm.category} onValueChange={(v) => setCreate('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_DOC_CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {docCategoryLabels[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input
                    placeholder="Titre du document"
                    value={createForm.title}
                    onChange={(e) => setCreate('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de fichier</label>
                  <Input
                    placeholder="PDF, DOCX, XLSX..."
                    value={createForm.fileType}
                    onChange={(e) => setCreate('fileType', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chemin fichier</label>
                  <Input
                    placeholder="/equipment/documents/fichier.pdf"
                    value={createForm.filePath}
                    onChange={(e) => setCreate('filePath', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille (octets)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={createForm.fileSize}
                    onChange={(e) => setCreate('fileSize', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description du document"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreate('description', e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleCreate} disabled={creating || !createForm.equipmentId || !createForm.title.trim()}>
                  {creating ? 'Création...' : 'Créer le document'}
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
                placeholder="Rechercher un document..."
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
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {EQUIPMENT_DOC_CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {docCategoryLabels[value] || value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun document disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Équipement</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Type fichier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title || '—'}</TableCell>
                      <TableCell className="text-sm">{item.equipmentName || equipmentName(item.equipmentId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{docCategoryLabels[item.category] || item.category || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.version != null ? `v${item.version}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.fileType || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
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
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez les informations du document ci-dessous.
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
                <label className="text-sm font-medium">Catégorie *</label>
                <Select value={editForm.category} onValueChange={(v) => setEdit('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_DOC_CATEGORIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {docCategoryLabels[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  placeholder="Titre du document"
                  value={editForm.title}
                  onChange={(e) => setEdit('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de fichier</label>
                <Input
                  placeholder="PDF, DOCX, XLSX..."
                  value={editForm.fileType}
                  onChange={(e) => setEdit('fileType', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chemin fichier</label>
                <Input
                  placeholder="/equipment/documents/fichier.pdf"
                  value={editForm.filePath}
                  onChange={(e) => setEdit('filePath', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Taille (octets)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editForm.fileSize}
                  onChange={(e) => setEdit('fileSize', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Description du document"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEdit('description', e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={saving || !editForm.equipmentId || !editForm.title.trim()}>
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
