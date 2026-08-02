'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Brain,
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
  useDiagnosticsData,
  usePatientsData,
  useUsersData,
  useDiseasesData,
  useConsultationsData,
  useCreateDiagnostic,
  useUpdateDiagnostic,
  useDeleteDiagnostic,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { diagnosticSchema, diagnosticEditSchema, toDiagnosticPayload, DIAGNOSTIC_TYPES, type DiagnosticValues, type DiagnosticEditValues } from '@/lib/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import { MedicalPreviewDialog, type PreviewData } from '@/components/medical-preview-dialog'

const diagnosticTypeConfig: Record<string, { label: string; color: string }> = {
  PROVISIONAL: { label: 'Provisoire', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  FINAL: { label: 'Final', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DIFFERENTIAL: { label: 'Différentiel', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
}

interface DiagnosticItem {
  id: string
  consultationId?: string
  patientId: string
  doctorId: string
  diseaseId?: string
  diagnosticType: string
  description: string
  notes?: string
  isValidated?: boolean
  validatedBy?: string
  validatedAt?: string
  createdAt: string
  updatedAt: string
  patientFirstname?: string
  patientLastname?: string
  doctorFirstname?: string
  doctorLastname?: string
  diseaseCode?: string
  diseaseName?: string
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
  firstName?: string
  lastName?: string
  [key: string]: unknown
}

interface DiseaseItem {
  id: string
  code?: string
  name?: string
  [key: string]: unknown
}

interface ConsultationItem {
  id: string
  consultationNumber?: string
  [key: string]: unknown
}

export { DiagnosticsView }
export default function DiagnosticsView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [validatedFilter, setValidatedFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(typeFilter !== 'all' ? [`diagnosticType=${typeFilter}`] : []),
    ...(validatedFilter !== 'all' ? [`validated=${validatedFilter}`] : []),
  ].join('&')

  const { data, isLoading } = useDiagnosticsData(searchParams)

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: diseasesData } = useDiseasesData()
  const { data: consultationsData } = useConsultationsData()

  const createDiagnostic = useCreateDiagnostic()
  const updateDiagnostic = useUpdateDiagnostic()
  const deleteDiagnostic = useDeleteDiagnostic()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const diseasesList = (diseasesData?.items ?? []) as DiseaseItem[]
  const consultationsList = (consultationsData?.items ?? []) as ConsultationItem[]

  const doctorsList = usersList.filter((u) =>
    ['doctor', 'specialist'].includes(String(u.role || '').toLowerCase())
  )

  const items = (data?.items ?? []) as DiagnosticItem[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDiagnostic, setEditingDiagnostic] = useState<DiagnosticItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const createForm = useForm<DiagnosticValues>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: { patientId: '', doctorId: '', consultationId: '', diseaseId: '', diagnosticType: 'PROVISIONAL', description: '', notes: '' },
  })
  const editForm = useForm<DiagnosticEditValues>({
    resolver: zodResolver(diagnosticEditSchema),
    defaultValues: { doctorId: '', diseaseId: '', diagnosticType: 'PROVISIONAL', description: '', notes: '' },
  })

  const handleCreate = createForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      await createDiagnostic.mutateAsync(toDiagnosticPayload(values))
      await queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
      toast({ title: 'Diagnostic créé', description: `"${values.description}" a été enregistré.` })
      setDialogOpen(false)
      createForm.reset()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le diagnostic.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  const openEdit = (d: DiagnosticItem) => {
    setEditingDiagnostic(d)
    editForm.reset({
      doctorId: (d.doctorId as string) || '',
      diseaseId: (d.diseaseId as string) || '',
      diagnosticType: (d.diagnosticType as DiagnosticEditValues['diagnosticType']) || 'PROVISIONAL',
      description: (d.description as string) || '',
      notes: (d.notes as string) || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = editForm.handleSubmit(async (values) => {
    if (!editingDiagnostic) return
    setSaving(true)
    try {
      await updateDiagnostic.mutateAsync({
        id: editingDiagnostic.id as string,
        data: toDiagnosticPayload(values),
      })
      toast({ title: 'Diagnostic mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingDiagnostic(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le diagnostic.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = (d: DiagnosticItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer ce diagnostic "${d.description}" ?`,
      callback: async () => {
        try {
          await deleteDiagnostic.mutateAsync(d.id as string)
          toast({ title: 'Diagnostic supprimé', description: `"${d.description}" a été supprimé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer le diagnostic.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diagnostics</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} diagnostic{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('diagnostics:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Diagnostic
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Diagnostic</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer un nouveau diagnostic.
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
                  <label className="text-sm font-medium">Médecin *</label>
                  <Controller
                    control={createForm.control}
                    name="doctorId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un médecin" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctorsList.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.doctorId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.doctorId.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation *</label>
                  <Controller
                    control={createForm.control}
                    name="consultationId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une consultation" />
                        </SelectTrigger>
                        <SelectContent>
                          {consultationsList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.consultationNumber || c.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {createForm.formState.errors.consultationId && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.consultationId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maladie</label>
                  <Controller
                    control={createForm.control}
                    name="diseaseId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une maladie" />
                        </SelectTrigger>
                        <SelectContent>
                          {diseasesList.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.code ? `${d.code} — ${d.name}` : d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Controller
                  control={createForm.control}
                  name="diagnosticType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAGNOSTIC_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{diagnosticTypeConfig[t]?.label || t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {createForm.formState.errors.diagnosticType && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.diagnosticType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Description du diagnostic"
                  rows={3}
                  {...createForm.register('description')}
                />
                {createForm.formState.errors.description && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes cliniques"
                  rows={3}
                  {...createForm.register('notes')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer le diagnostic'}
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
                placeholder="Rechercher un diagnostic..."
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
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="PROVISIONAL">Provisoire</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="DIFFERENTIAL">Différentiel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={validatedFilter} onValueChange={(v) => {
                setValidatedFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Validation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="validated">Validés</SelectItem>
                  <SelectItem value="pending">Non validés</SelectItem>
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun diagnostic disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Maladie</TableHead>
                    <TableHead>Validé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: DiagnosticItem) => {
                    const type = String(item.diagnosticType || '').toUpperCase()
                    const typeConfig = diagnosticTypeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim() || '—'
                    const docName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim() || '—'
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/diagnostics/${item.id}`)}
                      >
                        <TableCell>
                          <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">
                          {String(item.description || '—')}
                        </TableCell>
                        <TableCell className="font-medium">{patientName}</TableCell>
                        <TableCell>{docName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {String(item.diseaseName || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isValidated
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {item.isValidated ? 'Validé' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('diagnostics:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('diagnostics:edit') && (
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
                              onClick={() => router.push(`/diagnostics/${item.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewData({
                                type: 'diagnostic',
                                title: `Diagnostic ${item.diagnosticType || ''}`,
                                patient: item.patientFirstname ? { firstname: item.patientFirstname, lastname: item.patientLastname || '' } : null,
                                doctor: item.doctorFirstname ? { firstname: item.doctorFirstname, lastname: item.doctorLastname || '' } : null,
                                createdAt: item.createdAt,
                                sections: [
                                  { title: 'Type', content: item.diagnosticType || '—' },
                                  { title: 'Description', content: item.description || '—' },
                                  ...(item.diseaseName ? [{ title: 'Maladie', content: `${item.diseaseCode ? item.diseaseCode + ' - ' : ''}${item.diseaseName}` }] : []),
                                  ...(item.notes ? [{ title: 'Notes', content: item.notes }] : []),
                                  { title: 'Validé', content: item.isValidated ? 'Oui' : 'Non' },
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
                                  type: 'diagnostic',
                                  title: `Diagnostic ${item.diagnosticType || ''}`,
                                  patient: item.patientFirstname ? { firstname: item.patientFirstname, lastname: item.patientLastname || '' } : null,
                                  doctor: item.doctorFirstname ? { firstname: item.doctorFirstname, lastname: item.doctorLastname || '' } : null,
                                  createdAt: item.createdAt,
                                  sections: [
                                    { title: 'Type', content: item.diagnosticType || '—' },
                                    { title: 'Description', content: item.description || '—' },
                                    ...(item.diseaseName ? [{ title: 'Maladie', content: `${item.diseaseCode ? item.diseaseCode + ' - ' : ''}${item.diseaseName}` }] : []),
                                    ...(item.notes ? [{ title: 'Notes', content: item.notes }] : []),
                                    { title: 'Validé', content: item.isValidated ? 'Oui' : 'Non' },
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
                              onClick={() => router.push(`/diagnostics/${item.id}/fiche`)}
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
            <DialogTitle>Modifier le diagnostic</DialogTitle>
            <DialogDescription>
              Modifiez les informations du diagnostic ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Controller
                control={editForm.control}
                name="diagnosticType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAGNOSTIC_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{diagnosticTypeConfig[t]?.label || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maladie</label>
              <Controller
                control={editForm.control}
                name="diseaseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une maladie" />
                    </SelectTrigger>
                    <SelectContent>
                      {diseasesList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.code ? `${d.code} — ${d.name}` : d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Médecin</label>
              <Controller
                control={editForm.control}
                name="doctorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsList.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName || u.firstname || u.lastName || u.lastname ? `${u.firstName || u.firstname || ''} ${u.lastName || u.lastname || ''}`.trim() : u.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                rows={3}
                {...editForm.register('description')}
              />
              {editForm.formState.errors.description && (
                <p className="text-xs text-destructive">{editForm.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                rows={3}
                {...editForm.register('notes')}
              />
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

      <MedicalPreviewDialog
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
        data={previewData}
        onNavigate={() => {
          if (previewData) {
            const allItems = (data?.items ?? []) as DiagnosticItem[]
            const item = allItems.find((i) => `Diagnostic ${i.diagnosticType || ''}` === previewData.title)
            if (item) router.push(`/diagnostics/${item.id}`)
          }
          setPreviewData(null)
        }}
      />
    </div>
  )
}
