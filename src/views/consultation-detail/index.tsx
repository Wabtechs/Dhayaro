'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  HeartPulse,
  Activity,
  FileText,
  FlaskConical,
  Microscope,
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
  useConsultationDetail,
  usePatientsData,
  useUsersData,
  useFacilitiesData,
  useUpdateConsultation,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  WAITING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: consultation, isLoading, error } = useConsultationDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()
  const updateConsultation = useUpdateConsultation()
  const { toast } = useToast()

  const c = consultation as Record<string, unknown> | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    motif: '', notes: '', provisionalDiagnosis: '', status: 'WAITING', doctorId: '',
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de la consultation...</p>
      </div>
    )
  }

  if (error || !c) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Consultation non trouvée
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La consultation demandée n&apos;existe pas ou a été annulée.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/consultations')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const status = (c.status as string) || 'WAITING'
  const motif = (c.motif as string) || ''
  const notes = (c.notes as string) || ''
  const provisionalDiagnosis = (c.provisionalDiagnosis as string) || ''
  const symptoms = (c.symptoms as string[]) || []
  const vitalSigns = (c.vitalSigns as Record<string, unknown>) || {}
  const consultationNumber = (c.consultationNumber as string) || ''
  const createdAt = (c.createdAt as string) || ''
  const updatedAt = (c.updatedAt as string) || ''
  const consultationId = (c.id as string) || id
  const patientId = (c.patientId as string) || ''
  const doctorId = (c.doctorId as string) || ''
  const facilityId = (c.facilityId as string) || ''
  const isFollowUp = Boolean(c.isFollowUp)
  const previousConsultationId = (c.previousConsultationId as string) || ''

  const patientItems = ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const userItems = ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const facilityItems = ((facilitiesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)
  const facility = facilityItems.find((f) => f.id === facilityId)

  const patientName = patient ? `${(patient.firstName as string) || ''} ${(patient.lastName as string) || ''}`.trim() : 'Inconnu'
  const doctorName = doctor ? `${(doctor.firstName as string) || ''} ${(doctor.lastName as string) || ''}`.trim() : 'Inconnu'
  const facilityName = (facility?.name as string) || 'Inconnu'

  const relatedDiagnostics = (c.diagnostics as Array<Record<string, unknown>>) || []
  const relatedTreatments = (c.treatments as Array<Record<string, unknown>>) || []
  const relatedLabExams = (c.labExams as Array<Record<string, unknown>>) || []

  const statusActions: { label: string; status: string; icon: React.ReactNode }[] = []
  if (status === 'WAITING') {
    statusActions.push({ label: 'Démarrer', status: 'IN_PROGRESS', icon: <Activity className="mr-2 h-4 w-4" /> })
  }
  if (status === 'IN_PROGRESS') {
    statusActions.push({ label: 'Terminer', status: 'COMPLETED', icon: <CheckCircle className="mr-2 h-4 w-4" /> })
    statusActions.push({ label: 'Annuler', status: 'CANCELLED', icon: <AlertCircle className="mr-2 h-4 w-4" /> })
  }
  if (status === 'COMPLETED') {
    statusActions.push({ label: 'Rouvrir', status: 'IN_PROGRESS', icon: <Clock className="mr-2 h-4 w-4" /> })
  }

  const openEditDialog = () => {
    setEditForm({
      motif,
      notes,
      provisionalDiagnosis,
      status,
      doctorId: doctorId || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: {
          motif: editForm.motif,
          notes: editForm.notes || null,
          provisionalDiagnosis: editForm.provisionalDiagnosis || null,
          status: editForm.status,
          doctorId: editForm.doctorId || undefined,
        },
      })
      toast({ title: 'Consultation mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la consultation.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: { status: newStatus },
      })
      toast({ title: 'Statut mis à jour', description: `La consultation est maintenant "${statusConfig[newStatus]?.label || newStatus}".` })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de changer le statut.", variant: 'destructive' })
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
            onClick={() => router.push('/consultations')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Consultation {consultationNumber}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={statusConfig[status]?.color || 'bg-gray-100 text-gray-700'}>
                {statusConfig[status]?.label || status}
              </Badge>
              {isFollowUp && (
                <Badge variant="outline">
                  <HeartPulse className="mr-1 h-3 w-3" />
                  Suivi
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('consultations:edit') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {statusActions.map((action) => (
            <Button
              key={action.status}
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(action.status)}
              disabled={updateConsultation.isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {motif && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Motif de consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {motif}
                </p>
              </CardContent>
            </Card>
          )}

          {symptoms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Symptômes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom) => (
                    <Badge key={symptom} variant="outline">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(vitalSigns).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signes vitaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(vitalSigns).map(([key, value]) => (
                    <div key={key} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs uppercase text-muted-foreground">{key}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {provisionalDiagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diagnostic provisoire</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {provisionalDiagnosis}
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

          {relatedDiagnostics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Microscope className="h-4 w-4" />
                  Diagnostics ({relatedDiagnostics.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedDiagnostics.map((d) => (
                  <div key={d.id as string} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {String(d.description as string)}
                      </p>
                      <Badge variant={(d.isValidated as boolean) ? 'default' : 'secondary'}>
                        {d.isValidated ? 'Validé' : 'En attente'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(d.diagnosticType as string)} · {d.diseaseName ? String(d.diseaseName) : 'Maladie non spécifiée'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {relatedTreatments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4" />
                  Traitements ({relatedTreatments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedTreatments.map((t) => (
                  <div key={t.id as string} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {String(t.description as string)}
                      </p>
                      <Badge variant="outline">{String(t.status as string)}</Badge>
                    </div>
                    {t.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{String(t.notes as string)}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {relatedLabExams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Examens laboratoire ({relatedLabExams.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedLabExams.map((e) => (
                  <div key={e.id as string} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {String(e.examName as string)}
                      </p>
                      <Badge variant="outline">{String(e.status as string)}</Badge>
                    </div>
                    {e.clinicalIndication && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Indication: {String(e.clinicalIndication as string)}
                      </p>
                    )}
                  </div>
                ))}
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
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{doctorName}</p>
                    {can('consultations:edit') && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={openEditDialog}>
                        Changer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Établissement</p>
                  <p className="text-sm font-medium text-foreground">{facilityName}</p>
                </div>
              </div>

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

              {isFollowUp && previousConsultationId && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Consultation précédente</p>
                      <Link
                        href={`/consultations/${previousConsultationId}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        Voir la consultation précédente
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isFollowUp && previousConsultationId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HeartPulse className="h-4 w-4" />
                  Historique de suivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/consultations/${previousConsultationId}`}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Consultation précédente
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la consultation</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la consultation ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motif">Motif</Label>
              <Input id="motif" value={editForm.motif} onChange={(e) => setEditForm({ ...editForm, motif: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provisionalDiagnosis">Diagnostic provisoire</Label>
              <Textarea id="provisionalDiagnosis" rows={2} value={editForm.provisionalDiagnosis} onChange={(e) => setEditForm({ ...editForm, provisionalDiagnosis: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorId">Médecin</Label>
              <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
                <SelectTrigger id="doctorId">
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {userItems.filter((u) => (u.role as string) === 'DOCTOR' || (u.role as string) === 'SPECIALIST').map((doc) => (
                    <SelectItem key={doc.id as string} value={doc.id as string}>
                      {`${(doc.firstName as string) || ''} ${(doc.lastName as string) || ''}`.trim() || (doc.email as string)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAITING">En attente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
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
