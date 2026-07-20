'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  Microscope,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  useDiagnosticDetail,
  usePatientsData,
  useUsersData,
  useDiseasesData,
  useUpdateDiagnostic,
  useDeleteDiagnostic,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate, formatDateTime } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const diagnosticTypeConfig: Record<string, { label: string; color: string }> = {
  PROVISIONAL: { label: 'Provisoire', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  FINAL: { label: 'Final', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DIFFERENTIAL: { label: 'Différentiel', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
}

export default function DiagnosticDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: diagnostic, isLoading, error } = useDiagnosticDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: diseasesData } = useDiseasesData()
  const updateDiagnostic = useUpdateDiagnostic()
  const deleteDiagnostic = useDeleteDiagnostic()
  const { toast } = useToast()

  const d = diagnostic as Record<string, unknown> | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    diagnosticType: 'PROVISIONAL' as string,
    diseaseId: '',
    description: '',
    notes: '',
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement du diagnostic...</p>
      </div>
    )
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Diagnostic non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le diagnostic demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/diagnostics')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const diagnosticId = (d.id as string) || id
  const diagnosticType = (d.diagnosticType as string) || 'PROVISIONAL'
  const description = (d.description as string) || ''
  const notes = (d.notes as string) || ''
  const isValidated = Boolean(d.isValidated)
  const validatedAt = (d.validatedAt as string) || ''
  const diseaseName = (d.diseaseName as string) || ''
  const diseaseCode = (d.diseaseCode as string) || ''
  const diseaseId = (d.diseaseId as string) || ''
  const patientId = (d.patientId as string) || ''
  const doctorId = (d.doctorId as string) || ''
  const consultationId = (d.consultationId as string) || ''
  const createdAt = (d.createdAt as string) || ''
  const updatedAt = (d.updatedAt as string) || ''

  const patientItems = ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const userItems = ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const diseaseItems = ((diseasesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)
  const disease = diseaseItems.find((x) => x.id === diseaseId)

  const patientName = patient
    ? `${(patient.firstName as string) || (patient.firstname as string) || ''} ${(patient.lastName as string) || (patient.lastname as string) || ''}`.trim() || 'Inconnu'
    : 'Inconnu'
  const doctorName = doctor
    ? `${(doctor.firstName as string) || (doctor.firstname as string) || ''} ${(doctor.lastName as string) || (doctor.lastname as string) || ''}`.trim() || 'Inconnu'
    : 'Inconnu'

  const diseaseLabel = diseaseName || (disease ? `${disease.code ? `${disease.code} — ` : ''}${disease.name}` : '') || 'Maladie non spécifiée'

  const typeConfig = diagnosticTypeConfig[String(diagnosticType).toUpperCase()] || { label: diagnosticType, color: 'bg-gray-100 text-gray-700' }

  const openEditDialog = () => {
    setEditForm({
      diagnosticType,
      diseaseId,
      description,
      notes,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updateDiagnostic.mutateAsync({
        id: diagnosticId,
        data: {
          diagnosticType: editForm.diagnosticType,
          diseaseId: sanitizeUuid(editForm.diseaseId) || undefined,
          description: editForm.description,
          notes: editForm.notes || null,
        },
      })
      toast({ title: 'Diagnostic mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le diagnostic.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async () => {
    try {
      await updateDiagnostic.mutateAsync({
        id: diagnosticId,
        data: { isValidated: true },
      })
      toast({ title: 'Diagnostic validé', description: 'Le diagnostic a été validé.' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de valider le diagnostic.', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce diagnostic ?')) return
    try {
      await deleteDiagnostic.mutateAsync(diagnosticId)
      toast({ title: 'Diagnostic supprimé', description: 'Le diagnostic a été supprimé.' })
      router.push('/diagnostics')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le diagnostic.', variant: 'destructive' })
    }
  }

  const truncatedDescription = description.length > 60 ? `${description.slice(0, 60)}...` : description

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/diagnostics')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {truncatedDescription}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
              <Badge
                className={
                  isValidated
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }
              >
                {isValidated ? 'Validé' : 'En attente'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('diagnostics:edit') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {can('diagnostics:validate') && !isValidated && (
          <Button variant="outline" size="sm" onClick={handleValidate} disabled={updateDiagnostic.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Valider
          </Button>
          )}
          {can('diagnostics:edit') && (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
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
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
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
                <Microscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Maladie</p>
                  <p className="text-sm font-medium text-foreground">
                    {diseaseCode ? `${diseaseCode} — ` : ''}{diseaseLabel}
                  </p>
                </div>
              </div>

              <Separator />

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

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Statut de validation</p>
                  <p className="text-sm font-medium text-foreground">
                    {isValidated ? 'Validé' : 'En attente'}
                  </p>
                  {isValidated && validatedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Validé le {formatDateTime(validatedAt)}
                    </p>
                  )}
                </div>
              </div>

              {consultationId && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Consultation</p>
                      <Link
                        href={`/consultations/${consultationId}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        Voir la consultation
                      </Link>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le diagnostic</DialogTitle>
            <DialogDescription>
              Modifiez les détails du diagnostic ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosticType">Type</Label>
              <Select value={editForm.diagnosticType} onValueChange={(v) => setEditForm({ ...editForm, diagnosticType: v })}>
                <SelectTrigger id="diagnosticType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROVISIONAL">Provisoire</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="DIFFERENTIAL">Différentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diseaseId">Maladie</Label>
              <Select value={editForm.diseaseId} onValueChange={(v) => setEditForm({ ...editForm, diseaseId: v })}>
                <SelectTrigger id="diseaseId">
                  <SelectValue placeholder="Sélectionner une maladie" />
                </SelectTrigger>
                <SelectContent>
                  {diseaseItems.map((x) => (
                    <SelectItem key={x.id as string} value={x.id as string}>
                      {x.code ? `${x.code} — ${x.name}` : (x.name as string)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" disabled={saving || !editForm.description} onClick={handleUpdate}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
