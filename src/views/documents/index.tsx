'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileText,
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
  useDocumentsData,
  usePatientsData,
  useUsersData,
  useConsultationsData,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

const typeLabels: Record<string, string> = {
  PRESCRIPTION: 'Prescription',
  CERTIFICATE: 'Certificat',
  REPORT: 'Rapport',
  LAB_RESULT: 'Résultat labo',
  REFERRAL: 'Référence',
  ORDONNANCE: 'Ordonnance',
}

interface DocumentItem {
  id: string
  facilityId?: string
  patientId?: string
  consultationId?: string
  doctorId?: string
  documentType: string
  title: string
  content?: Record<string, unknown>
  filePath?: string
  isPrinted?: boolean
  createdAt: string
  updatedAt?: string
  patientFirstname?: string
  patientLastname?: string
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
  firstname?: string
  firstName?: string
  lastname?: string
  lastName?: string
  [key: string]: unknown
}

interface ConsultationItem {
  id: string
  [key: string]: unknown
}

export { DocumentsView }
export default function DocumentsView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useDocumentsData(
    typeFilter !== 'all' ? `documentType=${typeFilter}` : ''
  )

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: consultationsData } = useConsultationsData()

  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const consultationsList = (consultationsData?.items ?? []) as ConsultationItem[]
  const doctorsList = usersList.filter((u) => u.role === 'doctor')

  const resolveDoctorName = (item: DocumentItem) => {
    const doctorId = (item.assignedDoctorId || item.doctorId) as string | undefined
    if (!doctorId) return '—'
    const u = usersList.find((item) => item.id === doctorId)
    if (!u) return '—'
    const name = `${u.firstname || u.firstName || ''} ${u.lastname || u.lastName || ''}`.trim()
    return name || (u.name as string) || '—'
  }

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as DocumentItem[]
    const q = search.toLowerCase()
    const userItems = (usersData?.items ?? []) as UserItem[]
    return allItems.filter((item) => {
      if (!search) return true
      const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim().toLowerCase()
      let doctorName = '—'
      if (item.doctorId) {
        const u = userItems.find((x) => x.id === item.doctorId)
        if (u) {
          const name = `${u.firstname || u.firstName || ''} ${u.lastname || u.lastName || ''}`.trim()
          doctorName = name || (u.name as string) || '—'
        }
      }
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        patientName.includes(q) ||
        doctorName.toLowerCase().includes(q)
      )
    })
  }, [data, search, usersData])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [newDocument, setNewDocument] = useState({
    patientId: '',
    doctorId: '',
    consultationId: 'none',
    documentType: '',
    title: '',
    content: '',
    filePath: '',
  })

  const [editForm, setEditForm] = useState({
    patientId: '',
    doctorId: '',
    consultationId: 'none',
    documentType: '',
    title: '',
    content: '',
    isPrinted: false,
  })

  const handleCreate = async () => {
    if (!newDocument.title.trim()) {
      toast({ title: 'Erreur', description: 'Le titre est requis.', variant: 'destructive' })
      return
    }
    if (!newDocument.documentType) {
      toast({ title: 'Erreur', description: 'Le type de document est requis.', variant: 'destructive' })
      return
    }
    if (!newDocument.patientId) {
      toast({ title: 'Erreur', description: 'Le patient est requis.', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      let parsedContent: Record<string, unknown> = {}
      const raw = newDocument.content.trim()
      if (raw) {
        try {
          parsedContent = JSON.parse(raw)
        } catch {
          parsedContent = { text: raw }
        }
      }
      await createDocument.mutateAsync({
        patientId: sanitizeUuid(newDocument.patientId) || undefined,
        doctorId: sanitizeUuid(newDocument.doctorId) || undefined,
        consultationId:
          newDocument.consultationId && newDocument.consultationId !== 'none'
            ? sanitizeUuid(newDocument.consultationId) || undefined
            : undefined,
        documentType: newDocument.documentType,
        title: newDocument.title.trim(),
        content: parsedContent,
        filePath: newDocument.filePath.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast({ title: 'Document créé', description: `"${newDocument.title}" a été enregistré.` })
      setDialogOpen(false)
      setNewDocument({ patientId: '', doctorId: '', consultationId: 'none', documentType: '', title: '', content: '', filePath: '' })
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le document.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (d: DocumentItem) => {
    setEditingDocument(d)
    setEditForm({
      patientId: (d.patientId as string) || '',
      doctorId: (d.doctorId as string) || '',
      consultationId: (d.consultationId as string) || 'none',
      documentType: (d.documentType as string) || '',
      title: (d.title as string) || '',
      content: d.content ? JSON.stringify(d.content, null, 2) : '',
      isPrinted: Boolean(d.isPrinted),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDocument) return
    setSaving(true)
    try {
      let parsedContent: Record<string, unknown> = {}
      const raw = editForm.content.trim()
      if (raw) {
        try {
          parsedContent = JSON.parse(raw)
        } catch {
          parsedContent = { text: raw }
        }
      }
      await updateDocument.mutateAsync({
        id: editingDocument.id as string,
        data: {
          patientId: sanitizeUuid(editForm.patientId) || undefined,
          doctorId: sanitizeUuid(editForm.doctorId) || undefined,
          consultationId:
            editForm.consultationId && editForm.consultationId !== 'none'
              ? sanitizeUuid(editForm.consultationId) || undefined
              : undefined,
          documentType: editForm.documentType,
          title: editForm.title.trim(),
          content: parsedContent,
          isPrinted: editForm.isPrinted,
        },
      })
      toast({ title: 'Document mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingDocument(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le document.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (d: DocumentItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer le document "${d.title}" ?`,
      callback: async () => {
        try {
          await deleteDocument.mutateAsync(d.id as string)
          toast({ title: 'Document supprimé', description: `"${d.title}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer le document.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} document{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('documents:create') && (
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
                Remplissez les informations pour enregistrer un nouveau document.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Select value={newDocument.patientId} onValueChange={(v) => setNewDocument({ ...newDocument, patientId: v })}>
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
                  <Select value={newDocument.doctorId} onValueChange={(v) => setNewDocument({ ...newDocument, doctorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Consultation (optionnel)</label>
                <Select value={newDocument.consultationId} onValueChange={(v) => setNewDocument({ ...newDocument, consultationId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une consultation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {consultationsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {String(c.consultationNumber || c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select value={newDocument.documentType} onValueChange={(v) => setNewDocument({ ...newDocument, documentType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input
                    placeholder="Titre du document"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contenu (JSON ou texte)</label>
                <Textarea
                  placeholder='{"texte": "..."} ou texte libre'
                  rows={4}
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chemin fichier (optionnel)</label>
                <Input
                  placeholder="/documents/fichier.pdf"
                  value={newDocument.filePath}
                  onChange={(e) => setNewDocument({ ...newDocument, filePath: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newDocument.title.trim() || !newDocument.documentType || !newDocument.patientId} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer le document'}
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
              <Select value={typeFilter} onValueChange={(v) => {
                setTypeFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun document disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Imprimé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item: DocumentItem) => {
                    const typeKey = String(item.documentType || '').toUpperCase()
                    const typeLabel = typeLabels[typeKey] || String(item.documentType || '—')
                    const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim() || '—'
                    const printed = Boolean(item.isPrinted)
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/documents/${item.id}`)}
                      >
                        <TableCell>
                          <Badge variant="outline">{typeLabel}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.title || '—')}
                        </TableCell>
                        <TableCell>{patientName}</TableCell>
                        <TableCell>{resolveDoctorName(item)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              printed
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {printed ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('documents:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('documents:delete') && (
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
                              onClick={() => router.push(`/documents/${item.id}`)}
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
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez les informations du document ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient *</label>
                <Select value={editForm.patientId} onValueChange={(v) => setEditForm({ ...editForm, patientId: v })}>
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
                  <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Consultation (optionnel)</label>
                <Select value={editForm.consultationId} onValueChange={(v) => setEditForm({ ...editForm, consultationId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une consultation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {consultationsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {String(c.consultationNumber || c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                <Select value={editForm.documentType} onValueChange={(v) => setEditForm({ ...editForm, documentType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contenu (JSON ou texte)</label>
              <Textarea
                rows={4}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              />
            </div>
            <div className="flex items-end space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={editForm.isPrinted}
                  onChange={(e) => setEditForm({ ...editForm, isPrinted: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Imprimé
              </label>
            </div>
          </div>
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
