'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TestTube,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Printer,
  FileDown,
  FileText,
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
  useLabExamsData,
  useCreateLabExam,
  useUpdateLabExam,
  useDeleteLabExam,
  useLabCategoriesData,
  usePatientsData,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { labExamSchema, labExamEditSchema, toLabExamPayload, LAB_EXAM_STATUSES, type LabExamValues, type LabExamEditValues } from '@/lib/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import { MedicalPreviewDialog, type PreviewData } from '@/components/medical-preview-dialog'

const statusConfig: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'Demandé', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

interface LabExamItem {
  id: string
  facilityId?: string
  patientId: string
  doctorId?: string
  labTechnicianId?: string
  categoryId?: string
  consultationId?: string
  examName: string
  clinicalIndication?: string
  status: string
  results?: Record<string, unknown>
  resultNotes?: string
  validatedBy?: string
  validatedAt?: string
  requestedAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  patientFirstname?: string
  patientLastname?: string
  doctorFirstname?: string
  doctorLastname?: string
  categoryName?: string
  [key: string]: unknown
}

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  [key: string]: unknown
}

interface CategoryItem {
  id: string
  name: string
  [key: string]: unknown
}

export { LaboratoryView }
export default function LaboratoryView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  const searchParams = useMemo(() => {
    const parts: string[] = [`page=${currentPage}`, 'size=10']
    if (search) parts.push(`search=${search}`)
    if (statusFilter !== 'all') parts.push(`status=${statusFilter}`)
    if (categoryFilter !== 'all') parts.push(`categoryId=${categoryFilter}`)
    return parts.join('&')
  }, [currentPage, search, statusFilter, categoryFilter])

  const { data, isLoading } = useLabExamsData(searchParams)

  const { data: patientsData } = usePatientsData()
  const { data: categoriesData } = useLabCategoriesData()

  const createLabExam = useCreateLabExam()
  const updateLabExam = useUpdateLabExam()
  const deleteLabExam = useDeleteLabExam()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const categoriesList = (categoriesData?.items ?? []) as CategoryItem[]

  const items = (data?.items ?? []) as LabExamItem[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingExam, setEditingExam] = useState<LabExamItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const createForm = useForm<LabExamValues>({
    resolver: zodResolver(labExamSchema),
    defaultValues: { patientId: '', categoryId: '', examName: '', clinicalIndication: '', results: '' },
  })
  const editForm = useForm<LabExamEditValues>({
    resolver: zodResolver(labExamEditSchema),
    defaultValues: { categoryId: '', labTechnicianId: '', examName: '', clinicalIndication: '', status: 'REQUESTED', results: '', resultNotes: '' },
  })

  const onCreate = createForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      await createLabExam.mutateAsync(toLabExamPayload(values))
      await queryClient.invalidateQueries({ queryKey: ['lab-exams'] })
      toast({ title: 'Examen créé', description: `"${values.examName}" a été enregistré.` })
      setDialogOpen(false)
      createForm.reset()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'examen.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  const openEdit = (exam: LabExamItem) => {
    setEditingExam(exam)
    const parsedResults = (() => {
      try {
        return exam.results ? JSON.stringify(exam.results, null, 2) : '{}'
      } catch {
        return '{}'
      }
    })()
    editForm.reset({
      categoryId: String(exam.categoryId ?? ''),
      labTechnicianId: String(exam.labTechnicianId ?? ''),
      examName: String(exam.examName ?? ''),
      clinicalIndication: String(exam.clinicalIndication ?? ''),
      status: (LAB_EXAM_STATUSES as readonly string[]).includes(exam.status as string) ? (exam.status as LabExamEditValues['status']) : 'REQUESTED',
      results: parsedResults,
      resultNotes: String(exam.resultNotes ?? ''),
    })
    setEditDialogOpen(true)
  }

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!editingExam) return
    setSaving(true)
    try {
      await updateLabExam.mutateAsync({
        id: editingExam.id as string,
        data: toLabExamPayload(values),
      })
      toast({ title: 'Examen mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingExam(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier l\'examen.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = (exam: LabExamItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer cet examen "${exam.examName}" ?`,
      callback: async () => {
        try {
          await deleteLabExam.mutateAsync(exam.id as string)
          toast({ title: 'Examen supprimé', description: `"${exam.examName}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer l\'examen.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Laboratoire</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} examen{totalCount > 1 ? 's' : ''} de laboratoire
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('lab:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel Examen
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Examen</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer un nouvel examen de laboratoire.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Controller
                    control={createForm.control}
                    name="patientId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    )}
                  />
                  {createForm.formState.errors.patientId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.patientId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Controller
                    control={createForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Examen *</label>
                <Input
                  placeholder="Nom de l'examen"
                  {...createForm.register('examName')}
                />
                {createForm.formState.errors.examName && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.examName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Indication clinique</label>
                <Textarea
                  placeholder="Indication clinique"
                  rows={2}
                  {...createForm.register('clinicalIndication')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Résultats (JSON)</label>
                <Textarea
                  rows={4}
                  {...createForm.register('results')}
                  placeholder={'{\n  "valeur": "..."\n}'}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating} onClick={onCreate}>
                {creating ? 'Création...' : 'Créer l\'examen'}
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
                placeholder="Rechercher un examen..."
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
              <Select value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="REQUESTED">Demandé</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => {
                setCategoryFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categoriesList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun examen de laboratoire disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date demande</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: LabExamItem) => {
                    const status = String(item.status || '').toUpperCase()
                    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim()
                    const doctorName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim()
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/laboratory/${item.id}`)}
                      >
                        <TableCell className="font-medium">
                          {String(item.examName || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {patientName || '—'}
                        </TableCell>
                        <TableCell>{doctorName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{String(item.categoryName || '—')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.requestedAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('lab:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('lab:delete') && (
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
                              onClick={() => router.push(`/laboratory/${item.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewData({
                                type: 'lab_result',
                                title: `Examen: ${item.examName || ''}`,
                                patient: item.patientFirstname ? { firstname: item.patientFirstname, lastname: item.patientLastname || '' } : null,
                                doctor: item.doctorFirstname ? { firstname: item.doctorFirstname, lastname: item.doctorLastname || '' } : null,
                                createdAt: item.createdAt,
                                sections: [
                                  { title: 'Examen', content: item.examName || '—' },
                                  ...(item.categoryName ? [{ title: 'Catégorie', content: item.categoryName }] : []),
                                  ...(item.clinicalIndication ? [{ title: 'Indication clinique', content: item.clinicalIndication }] : []),
                                  { title: 'Statut', content: item.status || '—' },
                                  ...(item.results && Object.keys(item.results).length ? [{ title: 'Résultats', content: item.results }] : []),
                                  ...(item.resultNotes ? [{ title: 'Notes de résultat', content: item.resultNotes }] : []),
                                ],
                              })}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const d: PreviewData = {
                                  type: 'lab_result',
                                  title: `Examen: ${item.examName || ''}`,
                                  patient: item.patientFirstname ? { firstname: item.patientFirstname, lastname: item.patientLastname || '' } : null,
                                  doctor: item.doctorFirstname ? { firstname: item.doctorFirstname, lastname: item.doctorLastname || '' } : null,
                                  createdAt: item.createdAt,
                                  sections: [
                                    { title: 'Examen', content: item.examName || '—' },
                                    ...(item.categoryName ? [{ title: 'Catégorie', content: item.categoryName }] : []),
                                    ...(item.clinicalIndication ? [{ title: 'Indication clinique', content: item.clinicalIndication }] : []),
                                    { title: 'Statut', content: item.status || '—' },
                                    ...(item.results && Object.keys(item.results).length ? [{ title: 'Résultats', content: item.results }] : []),
                                    ...(item.resultNotes ? [{ title: 'Notes de résultat', content: item.resultNotes }] : []),
                                  ],
                                }
                                setPreviewData(d)
                              }}
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/laboratory/${item.id}/fiche`)}
                            >
                              <FileText className="h-4 w-4" />
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
            <DialogTitle>Modifier l'examen</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'examen ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Examen *</label>
              <Input
                {...editForm.register('examName')}
              />
              {editForm.formState.errors.examName && (
                <p className="text-xs text-destructive">{editForm.formState.errors.examName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Controller
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAB_EXAM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Indication clinique</label>
              <Textarea
                rows={2}
                {...editForm.register('clinicalIndication')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Résultats (JSON)</label>
              <Textarea
                rows={4}
                {...editForm.register('results')}
                placeholder={'{\n  "valeur": "..."\n}'}
              />
              {editForm.formState.errors.results && (
                <p className="text-xs text-destructive">{editForm.formState.errors.results.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes de résultat</label>
              <Textarea
                rows={2}
                {...editForm.register('resultNotes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={saving} onClick={onUpdate}>
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

      <MedicalPreviewDialog
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
        data={previewData}
        onNavigate={() => {
          if (previewData) {
            const allItems = (data?.items ?? []) as LabExamItem[]
            const item = allItems.find((i) => `Examen: ${i.examName || ''}` === previewData.title)
            if (item) router.push(`/laboratory/${item.id}`)
          }
          setPreviewData(null)
        }}
      />
    </div>
  )
}
