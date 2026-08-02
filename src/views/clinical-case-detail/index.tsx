'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clinicalCaseSchema, toClinicalCasePayload, CASE_PRIORITIES, caseNoteSchema, type ClinicalCaseValues, type CaseNoteValues } from '@/lib/schemas'
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Tag,
  MessageSquare,
  Clock,
  Edit,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Loader2,
  Pencil,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  useClinicalCaseDetail,
  usePatientsData,
  useUsersData,
  useFacilitiesData,
  useUpdateClinicalCase,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuthStore } from '@/store/auth-store'
import { formatDate, formatDateTime, getInitials } from '@/lib/utils'
import type { CaseStatus, CaseNote } from '@/types'

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En Revu',
  resolved: 'Résolu',
  archived: 'Archivé',
}

const priorityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
}

export default function ClinicalCaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: clinicalCase, isLoading, error } = useClinicalCaseDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()
  const updateCase = useUpdateClinicalCase()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const c = clinicalCase as Record<string, unknown> | null | undefined
  const [notes, setNotes] = useState<CaseNote[]>([])

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const noteForm = useForm<CaseNoteValues>({
    resolver: zodResolver(caseNoteSchema),
    defaultValues: { content: '' },
  })
  const editForm = useForm<ClinicalCaseValues>({
    resolver: zodResolver(clinicalCaseSchema),
    defaultValues: { title: '', description: '', patientId: '', facilityId: '', assignedDoctorId: '', priority: 'medium', diagnosis: '', symptoms: '', tags: '' },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-12 w-full" /></CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-5 w-20" /></CardHeader>
              <CardContent><div className="flex flex-wrap gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-28 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div></CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-5 w-20" /></CardHeader>
              <CardContent><Skeleton className="h-12 w-full" /></CardContent>
            </Card>
            <Skeleton className="h-px w-full" />
            <div className="flex gap-1"><Skeleton className="h-8 w-24 rounded-md" /><Skeleton className="h-8 w-28 rounded-md" /></div>
            <Card>
              <CardContent className="p-4"><div className="rounded-lg border bg-muted/30 p-4 space-y-2"><Skeleton className="h-16 w-full" /><div className="flex justify-end"><Skeleton className="h-8 w-36 rounded-md" /></div></div></CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-28" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-32" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-32" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-28" /></div></div>
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-28" /></div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-5 w-12" /></CardHeader>
              <CardContent><div className="flex flex-wrap gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div></CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !c) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Cas non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le cas clinique demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/clinical-cases')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const caseStatus = (c.status as string) || 'active'
  const casePriority = (c.priority as string) || 'medium'
  const title = (c.title as string) || (c.diagnosis as string) || 'Sans titre'
  const description = (c.description as string) || ''
  const symptoms = (c.symptoms as string[]) || []
  const diagnosis = (c.diagnosis as string) || ''
  const treatment = (c.treatment as string) || ''
  const tags = (c.tags as string[]) || []
  const createdAt = (c.createdAt as string) || ''
  const updatedAt = (c.updatedAt as string) || ''
  const resolvedAt = (c.resolvedAt as string) || ''
  const caseId = (c.id as string) || id
  const patientId = (c.patientId as string) || ''
  const doctorId = (c.assignedDoctorId as string) || (c.doctorId as string) || ''
  const facilityId = (c.facilityId as string) || ''

  const patientItems = ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const userItems = ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const facilityItems = ((facilitiesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === doctorId)
  const facility = facilityItems.find((f) => f.id === facilityId)

  const patientName = patient ? `${(patient.firstName as string) || ''} ${(patient.lastName as string) || ''}`.trim() : 'Inconnu'
  const doctorName = doctor ? `${(doctor.firstName as string) || ''} ${(doctor.lastName as string) || ''}`.trim() : 'Inconnu'
  const facilityName = (facility?.name as string) || 'Inconnu'

  const onAddNote = noteForm.handleSubmit((values) => {
    const newNote: CaseNote = {
      id: `note-${Date.now()}`,
      caseId,
      authorId: (user?.id as string) || 'unknown',
      content: values.content.trim(),
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    noteForm.reset()
  })

  const statusActions: { label: string; status: CaseStatus; icon: React.ReactNode }[] = []
  if (caseStatus === 'draft') {
    statusActions.push({ label: 'Passer en Actif', status: 'active', icon: <Clock className="mr-2 h-4 w-4" /> })
  }
  if (caseStatus === 'active') {
    statusActions.push({ label: 'Passer en Revu', status: 'in_review', icon: <Edit className="mr-2 h-4 w-4" /> })
  }
  if (caseStatus === 'in_review') {
    statusActions.push({ label: 'Marquer Résolu', status: 'resolved', icon: <CheckCircle className="mr-2 h-4 w-4" /> })
    statusActions.push({ label: 'Réactiver', status: 'active', icon: <Clock className="mr-2 h-4 w-4" /> })
  }
  if (caseStatus === 'resolved') {
    statusActions.push({ label: 'Archiver', status: 'archived', icon: <AlertCircle className="mr-2 h-4 w-4" /> })
    statusActions.push({ label: 'Réactiver', status: 'active', icon: <Clock className="mr-2 h-4 w-4" /> })
  }

  const OUTCOME_MAP: Record<string, string> = {
    draft: 'PENDING',
    active: 'IN_PROGRESS',
    in_review: 'IN_PROGRESS',
    resolved: 'SUCCESS',
    archived: 'FAILURE',
  }

  const openEditDialog = () => {
    editForm.reset({
      title,
      description,
      patientId,
      facilityId,
      assignedDoctorId: doctorId,
      priority: casePriority as ClinicalCaseValues['priority'],
      diagnosis,
      symptoms: symptoms.join(', '),
      tags: tags.join(', '),
    })
    setEditDialogOpen(true)
  }

  const onUpdate = editForm.handleSubmit(async (values) => {
    setSaving(true)
    try {
      await updateCase.mutateAsync({
        id: caseId,
        data: toClinicalCasePayload(values),
      })
      toast({ title: 'Cas mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le cas.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleStatusChange = async (newStatus: CaseStatus) => {
    try {
      await updateCase.mutateAsync({
        id: caseId,
        data: { outcomeStatus: OUTCOME_MAP[newStatus] || 'PENDING' },
      })
      toast({ title: 'Statut mis à jour', description: `Le cas est maintenant "${statusLabels[newStatus]}".` })
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
            onClick={() => router.push('/clinical-cases')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={caseStatus as 'active' | 'in_review' | 'resolved' | 'draft' | 'archived'}>
                {statusLabels[caseStatus] || caseStatus}
              </Badge>
              <Badge variant={casePriority as 'low' | 'medium' | 'high' | 'critical'}>
                {priorityLabels[casePriority] || casePriority}
              </Badge>
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
              disabled={updateCase.isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
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

          {diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diagnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {diagnosis}
                </p>
              </CardContent>
            </Card>
          )}

          {treatment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traitement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {treatment}
                </p>
              </CardContent>
            </Card>
          )}

          <Separator />

          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Notes ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <Textarea
                  placeholder="Ajouter une note..."
                  rows={3}
                  {...noteForm.register('content')}
                />
                {noteForm.formState.errors.content && <p className="mt-1 text-xs text-destructive">{noteForm.formState.errors.content.message}</p>}
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={onAddNote}
                    disabled={!noteForm.watch('content')?.trim()}
                  >
                    <MessageSquare className="mr-2 h-3.5 w-3.5" />
                    Ajouter une note
                  </Button>
                </div>
              </div>

              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune note pour ce cas.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials('Moi')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Moi</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="relative ml-3 border-l-2 border-muted py-2 pl-6">
                <div className="relative mb-6">
                  <div className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cas créé</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(createdAt)}</p>
                  </div>
                </div>
                {updatedAt && updatedAt !== createdAt && (
                  <div className="relative mb-6">
                    <div className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-blue-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Dernière mise à jour</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(updatedAt)}</p>
                    </div>
                  </div>
                )}
                {resolvedAt && (
                  <div className="relative mb-6">
                    <div className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-green-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cas résolu</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
                  <p className="text-xs text-muted-foreground">Médecin assigné</p>
                  {doctor && (
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{getInitials(doctorName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{doctorName}</span>
                    </div>
                  )}
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

              {resolvedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Résolu le</p>
                    <p className="text-sm text-foreground">{formatDate(resolvedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le cas clinique</DialogTitle>
            <DialogDescription>
              Modifiez les détails du cas ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" {...editForm.register('title')} />
              {editForm.formState.errors.title && <p className="text-xs text-destructive">{editForm.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...editForm.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnostic</Label>
              <Textarea id="diagnosis" rows={2} {...editForm.register('diagnosis')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Controller
                name="priority"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {editForm.formState.errors.priority && <p className="text-xs text-destructive">{editForm.formState.errors.priority.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptômes (séparés par des virgules)</Label>
              <Input id="symptoms" {...editForm.register('symptoms')} placeholder="Ex: Fièvre, Toux" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input id="tags" {...editForm.register('tags')} placeholder="Ex: Urgent, Pédiatrie" />
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
