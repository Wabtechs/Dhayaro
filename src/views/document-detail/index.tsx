'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Pencil,
  Printer,
  Trash2,
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
  useDocumentDetail,
  usePatientsData,
  useUsersData,
  useConsultationsData,
  useUpdateDocument,
  useDeleteDocument,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  PRESCRIPTION: 'Prescription',
  CERTIFICATE: 'Certificat',
  REPORT: 'Rapport',
  LAB_RESULT: 'Résultat labo',
  REFERRAL: 'Référence',
  ORDONNANCE: 'Ordonnance',
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

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: document, isLoading, error } = useDocumentDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: consultationsData } = useConsultationsData()
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()
  const { toast } = useToast()

  const d = document as Record<string, unknown> | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    patientId: '',
    consultationId: 'none',
    documentType: '',
    title: '',
    content: '',
    isPrinted: false,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement du document...</p>
      </div>
    )
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Document non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le document demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/documents')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const documentId = (d.id as string) || id
  const patientId = (d.patientId as string) || ''
  const doctorId = (d.doctorId as string) || ''
  const consultationId = (d.consultationId as string) || ''
  const documentType = (d.documentType as string) || ''
  const typeKey = String(documentType).toUpperCase()
  const typeLabel = typeLabels[typeKey] || documentType || '—'
  const title = (d.title as string) || 'Sans titre'
  const content = (d.content as Record<string, unknown>) || {}
  const filePath = (d.filePath as string) || ''
  const isPrinted = Boolean(d.isPrinted)
  const createdAt = (d.createdAt as string) || ''
  const updatedAt = (d.updatedAt as string) || ''

  const patientItems = ((patientsData as unknown as { items?: PatientItem[] })?.items || []) as PatientItem[]
  const userItems = ((usersData as unknown as { items?: UserItem[] })?.items || []) as UserItem[]
  const consultationItems = ((consultationsData as unknown as { items?: ConsultationItem[] })?.items || []) as ConsultationItem[]

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)

  const patientName = patient
    ? `${(patient.firstName as string) || ''} ${(patient.lastName as string) || ''}`.trim()
    : 'Inconnu'
  const doctorName = doctor
    ? `${(doctor.firstname as string) || (doctor.firstName as string) || ''} ${(doctor.lastname as string) || (doctor.lastName as string) || ''}`.trim()
    : 'Inconnu'

  const contentEntries = Object.entries(content)

  const openEditDialog = () => {
    setEditForm({
      patientId,
      consultationId: consultationId || 'none',
      documentType,
      title,
      content: contentEntries.length ? JSON.stringify(content, null, 2) : '',
      isPrinted,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
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
        id: documentId,
        data: {
          patientId: editForm.patientId ? editForm.patientId : undefined,
          consultationId:
            editForm.consultationId && editForm.consultationId !== 'none'
              ? editForm.consultationId
              : undefined,
          documentType: editForm.documentType,
          title: editForm.title.trim(),
          content: parsedContent,
          isPrinted: editForm.isPrinted,
        },
      })
      toast({ title: 'Document mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le document.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le document "${title}" ?`)) return
    try {
      await deleteDocument.mutateAsync(documentId)
      toast({ title: 'Document supprimé', description: `"${title}" a été supprimé.` })
      router.push('/documents')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le document.', variant: 'destructive' })
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
            onClick={() => router.push('/documents')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{typeLabel}</Badge>
              <Badge
                className={
                  isPrinted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }
              >
                <Printer className="mr-1 h-3 w-3" />
                {isPrinted ? 'Imprimé' : 'Non imprimé'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('documents:create') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {can('documents:create') && (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {contentEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contentEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs uppercase text-muted-foreground">{key}</p>
                      <p className="mt-1 text-sm font-medium text-foreground whitespace-pre-wrap">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filePath && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chemin fichier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground break-all">
                  {filePath}
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

              {consultationId && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium text-foreground">{typeLabel}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Printer className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Imprimé</p>
                  <p className="text-sm font-medium text-foreground">
                    {isPrinted ? 'Oui' : 'Non'}
                  </p>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez les détails du document ci-dessous.
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
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultationId">Consultation (optionnel)</Label>
                <Select value={editForm.consultationId} onValueChange={(v) => setEditForm({ ...editForm, consultationId: v })}>
                  <SelectTrigger id="consultationId">
                    <SelectValue placeholder="Sélectionner une consultation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {consultationItems.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {String(c.consultationNumber || c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentType">Type</Label>
                <Select value={editForm.documentType} onValueChange={(v) => setEditForm({ ...editForm, documentType: v })}>
                  <SelectTrigger id="documentType">
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
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenu (JSON ou texte)</Label>
              <Textarea id="content" rows={4} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isPrinted"
                type="checkbox"
                checked={editForm.isPrinted}
                onChange={(e) => setEditForm({ ...editForm, isPrinted: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPrinted">Imprimé</Label>
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
