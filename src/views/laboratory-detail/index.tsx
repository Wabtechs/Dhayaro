'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  FlaskConical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  useLabExamDetail,
  usePatientsData,
  useUsersData,
  useLabCategoriesData,
  useUpdateLabExam,
  useDeleteLabExam,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const statusConfig: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'Demandé', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

interface LabExamRecord {
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
  results: Record<string, unknown>
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

export default function LaboratoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: exam, isLoading, error } = useLabExamDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: categoriesData } = useLabCategoriesData()
  const updateLabExam = useUpdateLabExam()
  const deleteLabExam = useDeleteLabExam()
  const { toast } = useToast()

  const e = exam as LabExamRecord | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    examName: '',
    categoryId: '',
    clinicalIndication: '',
    status: 'REQUESTED' as string,
    resultNotes: '',
    results: '{}',
    labTechnicianId: '',
  })

  const patientItems = useMemo(
    () => ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>,
    [patientsData]
  )
  const userItems = useMemo(
    () => ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>,
    [usersData]
  )
  const categoriesList = useMemo(
    () => ((categoriesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Array<Record<string, unknown>>,
    [categoriesData]
  )
  const labTechnicians = useMemo(
    () => userItems.filter((u) => u.role === 'LABORATORY'),
    [userItems]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de l'examen...</p>
      </div>
    )
  }

  if (error || !e) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Examen non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L'examen demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/laboratory')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const status = (e.status as string) || 'REQUESTED'
  const examName = (e.examName as string) || ''
  const clinicalIndication = (e.clinicalIndication as string) || ''
  const resultNotes = (e.resultNotes as string) || ''
  const results = (e.results as Record<string, unknown>) || {}
  const requestedAt = (e.requestedAt as string) || ''
  const completedAt = (e.completedAt as string) || ''
  const validatedAt = (e.validatedAt as string) || ''
  const examId = (e.id as string) || id
  const patientId = (e.patientId as string) || ''
  const doctorId = (e.doctorId as string) || ''
  const labTechnicianId = (e.labTechnicianId as string) || ''
  const categoryId = (e.categoryId as string) || ''

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)
  const labTechnician = userItems.find((u) => u.id === labTechnicianId)

  const patientName = patient
    ? `${(patient.firstName as string) || (patient.firstname as string) || ''} ${(patient.lastName as string) || (patient.lastname as string) || ''}`.trim()
    : `${e.patientFirstname || ''} ${e.patientLastname || ''}`.trim() || 'Inconnu'
  const doctorName = doctor
    ? `${(doctor.firstName as string) || (doctor.firstname as string) || ''} ${(doctor.lastName as string) || (doctor.lastname as string) || ''}`.trim()
    : `${e.doctorFirstname || ''} ${e.doctorLastname || ''}`.trim() || 'Inconnu'
  const labTechnicianName = labTechnician
    ? `${(labTechnician.firstName as string) || (labTechnician.firstname as string) || ''} ${(labTechnician.lastName as string) || (labTechnician.lastname as string) || ''}`.trim()
    : 'Inconnu'
  const categoryName = (e.categoryName as string) || (categoriesList.find((c) => c.id === categoryId)?.name as string) || 'Inconnu'

  const resultEntries = Object.entries(results).filter(([, v]) => v !== undefined && v !== null && v !== '')

  const openEditDialog = () => {
    const parsedResults = (() => {
      try {
        return results ? JSON.stringify(results, null, 2) : '{}'
      } catch {
        return '{}'
      }
    })()
    setEditForm({
      examName,
      categoryId,
      clinicalIndication,
      status,
      resultNotes,
      results: parsedResults,
      labTechnicianId,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const parsedResults = (() => {
        try {
          return editForm.results ? JSON.parse(editForm.results) : {}
        } catch {
          return {}
        }
      })() as Record<string, unknown>
      await updateLabExam.mutateAsync({
        id: examId,
        data: {
          examName: editForm.examName,
          categoryId: sanitizeUuid(editForm.categoryId) || undefined,
          clinicalIndication: editForm.clinicalIndication || null,
          status: editForm.status,
          resultNotes: editForm.resultNotes || null,
          results: parsedResults,
          labTechnicianId: sanitizeUuid(editForm.labTechnicianId) || undefined,
        },
      })
      toast({ title: 'Examen mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier l\'examen.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    try {
      await updateLabExam.mutateAsync({
        id: examId,
        data: { status: 'COMPLETED', results, resultNotes: resultNotes || null },
      })
      toast({ title: 'Examen validé', description: `L'examen "${examName}" est maintenant terminé.` })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de valider l\'examen.', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet examen "${examName}" ?`)) return
    setDeleting(true)
    try {
      await deleteLabExam.mutateAsync(examId)
      toast({ title: 'Examen supprimé', description: `"${examName}" a été supprimé.` })
      router.push('/laboratory')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'examen.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/laboratory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {examName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={statusConfig[status]?.color || 'bg-gray-100 text-gray-700'}>
                {statusConfig[status]?.label || status}
              </Badge>
              <Badge variant="outline">
                <FlaskConical className="mr-1 h-3 w-3" />
                {categoryName}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('lab:edit') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {can('lab:validate') && status !== 'COMPLETED' && (
            <Button variant="outline" size="sm" onClick={handleValidate} disabled={updateLabExam.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Valider
            </Button>
          )}
          {can('lab:delete') && (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {clinicalIndication && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indication clinique</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {clinicalIndication}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              {resultEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun résultat enregistré.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {resultEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs uppercase text-muted-foreground">{key}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {resultNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes résultat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {resultNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  {patient ? (
                    <Link
                      href={`/patients/${patientId}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {patientName}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">{patientName}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="text-sm font-medium text-foreground">{doctorName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="text-sm font-medium text-foreground">{categoryName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Technicien de laboratoire</p>
                  <p className="text-sm font-medium text-foreground">{labTechnicianName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge className={statusConfig[status]?.color || 'bg-gray-100 text-gray-700'}>
                    {statusConfig[status]?.label || status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Demandé le</p>
                  <p className="text-sm text-foreground">{formatDate(requestedAt)}</p>
                </div>
              </div>

              {completedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Terminé le</p>
                    <p className="text-sm text-foreground">{formatDate(completedAt)}</p>
                  </div>
                </div>
              )}

              {validatedAt && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Validé le</p>
                    <p className="text-sm text-foreground">{formatDate(validatedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'examen</DialogTitle>
            <DialogDescription>
              Modifiez les détails de l'examen ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Examen</Label>
              <Input id="examName" value={editForm.examName} onChange={(ev) => setEditForm({ ...editForm, examName: ev.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie</Label>
              <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesList.map((c) => (
                    <SelectItem key={c.id as string} value={c.id as string}>
                      {String(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicalIndication">Indication clinique</Label>
              <Textarea id="clinicalIndication" rows={2} value={editForm.clinicalIndication} onChange={(ev) => setEditForm({ ...editForm, clinicalIndication: ev.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUESTED">Demandé</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="labTechnicianId">Technicien de laboratoire</Label>
              <Select value={editForm.labTechnicianId} onValueChange={(v) => setEditForm({ ...editForm, labTechnicianId: v })}>
                <SelectTrigger id="labTechnicianId">
                  <SelectValue placeholder="Sélectionner un technicien (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {labTechnicians.map((u) => (
                    <SelectItem key={u.id as string} value={u.id as string}>
                      {String(u.name || `${(u.firstName as string) || ''} ${(u.lastName as string) || ''}`.trim())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="results">Résultats (JSON)</Label>
              <Textarea
                id="results"
                rows={4}
                value={editForm.results}
                onChange={(ev) => setEditForm({ ...editForm, results: ev.target.value })}
                placeholder={'{\n  "valeur": "..."\n}'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultNotes">Notes résultat</Label>
              <Textarea id="resultNotes" rows={2} value={editForm.resultNotes} onChange={(ev) => setEditForm({ ...editForm, resultNotes: ev.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
