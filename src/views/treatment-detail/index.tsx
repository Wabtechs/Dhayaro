'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  Activity,
  FileText,
  FlaskConical,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  useTreatmentDetail,
  usePatientsData,
  useUsersData,
  useConsultationsData,
  useDiagnosticsData,
  useUpdateTreatment,
  useDeleteTreatment,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const statusConfig: Record<string, { label: string; color: string }> = {
  PRESCRIBED: { label: 'Prescrit', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  SUSPENDED: { label: 'Suspendu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
}

const STATUS_OPTIONS = [
  { value: 'PRESCRIBED', label: 'Prescrit' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'SUSPENDED', label: 'Suspendu' },
]

export default function TreatmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: treatment, isLoading, error } = useTreatmentDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: consultationsData } = useConsultationsData()
  const { data: diagnosticsData } = useDiagnosticsData()
  const updateTreatment = useUpdateTreatment()
  const deleteTreatment = useDeleteTreatment()
  const { toast } = useToast()

  const c = treatment as Record<string, unknown> | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    patientId: '', doctorId: '', consultationId: '', diagnosisId: '',
    description: '', status: 'PRESCRIBED', startDate: '', endDate: '', notes: '', outcome: '',
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement du traitement...</p>
      </div>
    )
  }

  if (error || !c) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Traitement non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le traitement demandé n&apos;existe pas ou a été annulé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/treatments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const status = (c.status as string) || 'PRESCRIBED'
  const description = (c.description as string) || ''
  const notes = (c.notes as string) || ''
  const outcome = (c.outcome as string) || ''
  const startDate = (c.startDate as string) || ''
  const endDate = (c.endDate as string) || ''
  const createdAt = (c.createdAt as string) || ''
  const updatedAt = (c.updatedAt as string) || ''
  const treatmentId = (c.id as string) || id
  const patientId = (c.patientId as string) || ''
  const doctorId = (c.doctorId as string) || ''
  const consultationId = (c.consultationId as string) || ''
  const diagnosisId = (c.diagnosisId as string) || ''

  const patientItems = ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const userItems = ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const consultationItems = ((consultationsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const diagnosticItems = ((diagnosticsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)
  const consultation = consultationItems.find((ct) => ct.id === consultationId)
  const diagnosis = diagnosticItems.find((d) => d.id === diagnosisId)

  const patientName = patient ? `${(patient.firstName as string) || ''} ${(patient.lastName as string) || ''}`.trim() : 'Inconnu'
  const doctorName = doctor ? `${(doctor.firstName as string) || ''} ${(doctor.lastName as string) || ''}`.trim() : 'Inconnu'
  const consultationLabel = String(consultation?.consultationNumber || consultationId || 'Inconnu')
  const diagnosisLabel = String(diagnosis?.description || diagnosisId || 'Aucun')
  const doctorsList = userItems.filter((u) => u.role === 'doctor' || u.role === 'specialist')

  const statusActions: { label: string; status: string; icon: React.ReactNode }[] = []
  if (status === 'PRESCRIBED') {
    statusActions.push({ label: 'Démarrer', status: 'IN_PROGRESS', icon: <Activity className="mr-2 h-4 w-4" /> })
  }
  if (status === 'IN_PROGRESS') {
    statusActions.push({ label: 'Terminer', status: 'COMPLETED', icon: <CheckCircle className="mr-2 h-4 w-4" /> })
    statusActions.push({ label: 'Suspendre', status: 'SUSPENDED', icon: <Ban className="mr-2 h-4 w-4" /> })
  }
  statusActions.push({ label: 'Annuler', status: 'CANCELLED', icon: <AlertCircle className="mr-2 h-4 w-4" /> })

  const openEditDialog = () => {
    setEditForm({
      patientId,
      doctorId,
      consultationId,
      diagnosisId,
      description,
      status,
      startDate,
      endDate,
      notes,
      outcome,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateTreatment.mutateAsync({
        id: treatmentId,
        data: {
          patientId: sanitizeUuid(editForm.patientId),
          doctorId: sanitizeUuid(editForm.doctorId),
          consultationId: sanitizeUuid(editForm.consultationId) || undefined,
          diagnosisId: sanitizeUuid(editForm.diagnosisId) || undefined,
          description: editForm.description,
          status: editForm.status,
          startDate: editForm.startDate,
          endDate: editForm.endDate || null,
          notes: editForm.notes || null,
          outcome: editForm.outcome || null,
        },
      })
      toast({ title: 'Traitement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le traitement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTreatment.mutateAsync({
        id: treatmentId,
        data: { status: newStatus },
      })
      toast({ title: 'Statut mis à jour', description: `Le traitement est maintenant "${statusConfig[newStatus]?.label || newStatus}".` })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de changer le statut.", variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler ce traitement "${description}" ?`)) return
    try {
      await deleteTreatment.mutateAsync(treatmentId)
      toast({ title: 'Traitement annulé', description: `"${description}" a été annulé.` })
      router.push('/treatments')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler le traitement.', variant: 'destructive' })
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
            onClick={() => router.push('/treatments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="max-w-[320px] truncate text-2xl font-bold tracking-tight text-foreground">
              {description}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={statusConfig[status]?.color || 'bg-gray-100 text-gray-700'}>
                {statusConfig[status]?.label || status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can('treatments:create') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {can('treatments:create') && statusActions.map((action) => (
            <Button
              key={action.status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(action.status)}
              disabled={updateTreatment.isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          {can('treatments:delete') && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {notes}
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
                    <p className="text-sm text-muted-foreground">Inconnu</p>
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

              {consultationId && (
                <>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Consultation</p>
                      <Link
                        href={`/consultations/${consultationId}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {consultationLabel}
                      </Link>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Diagnostic</p>
                  <p className="text-sm font-medium text-foreground">{diagnosisLabel}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date début</p>
                  <p className="text-sm text-foreground">{formatDate(startDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date fin</p>
                  <p className="text-sm text-foreground">{endDate ? formatDate(endDate) : '—'}</p>
                </div>
              </div>

              {outcome && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Issue / Résultat</p>
                      <p className="text-sm font-medium text-foreground">{outcome}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="text-sm text-foreground">{formatDate(createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mis à jour le</p>
                  <p className="text-sm text-foreground">{formatDate(updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le traitement</DialogTitle>
            <DialogDescription>
              Modifiez les détails du traitement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient</Label>
                <Select value={editForm.patientId} onValueChange={(v) => setEditForm({ ...editForm, patientId: v })}>
                  <SelectTrigger id="patientId">
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientItems.map((p) => (
                      <SelectItem key={p.id as string} value={p.id as string}>
                        {`${p.firstName || ''} ${p.lastName || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorId">Médecin</Label>
                <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
                  <SelectTrigger id="doctorId">
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorsList.map((u) => (
                      <SelectItem key={u.id as string} value={u.id as string}>
                        {`${u.firstName || ''} ${u.lastName || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultationId">Consultation</Label>
                <Select value={editForm.consultationId} onValueChange={(v) => setEditForm({ ...editForm, consultationId: v })}>
                  <SelectTrigger id="consultationId">
                    <SelectValue placeholder="Sélectionner une consultation" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultationItems.map((ct) => (
                      <SelectItem key={ct.id as string} value={ct.id as string}>
                        {String(ct.consultationNumber || ct.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosisId">Diagnostic</Label>
                <Select value={editForm.diagnosisId} onValueChange={(v) => setEditForm({ ...editForm, diagnosisId: v })}>
                  <SelectTrigger id="diagnosisId">
                    <SelectValue placeholder="Sélectionner un diagnostic" />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnosticItems.map((d) => (
                      <SelectItem key={d.id as string} value={d.id as string}>
                        {String(d.description || d.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Date début</Label>
                <Input id="startDate" type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date fin</Label>
              <Input id="endDate" type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Issue / Résultat</Label>
              <Input id="outcome" value={editForm.outcome} onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })} />
            </div>
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
    </div>
  )
}
