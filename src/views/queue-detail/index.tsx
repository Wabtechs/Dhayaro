'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  Phone,
  FlaskConical,
  Pill,
  Activity,
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
import {
  useQueueDetail,
  usePatientsData,
  useUsersData,
  useFacilitiesData,
  useUpdateQueue,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { queueEditSchema, toQueueEditPayload, PRIORITIES, QUEUE_STATUSES, type QueueEditValues } from '@/lib/schemas'

const statusConfig: Record<string, { label: string; color: string }> = {
  WAITING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  WITH_DOCTOR: { label: 'Chez le médecin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  WITH_LAB: { label: 'Au laboratoire', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  WITH_PHARMACY: { label: 'À la pharmacie', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const DOCTOR_ROLES = ['DOCTOR', 'SPECIALIST', 'LABORATORY', 'doctor', 'specialist', 'laboratory']

export default function QueueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: queue, isLoading, error } = useQueueDetail(id)
  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()
  const updateQueue = useUpdateQueue()
  const { toast } = useToast()

  const q = queue as Record<string, unknown> | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const editForm = useForm<QueueEditValues>({
    resolver: zodResolver(queueEditSchema),
    defaultValues: { priority: 'NORMAL', assignedDoctorId: '', notes: '', status: 'WAITING' },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><Skeleton className="h-5 w-16" /></CardHeader>
              <CardContent><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-28" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-14" /><Skeleton className="h-4 w-24" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-32" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-14" /><Skeleton className="h-4 w-16" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-20" /></div></div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-start gap-3"><Skeleton className="h-4 w-4 rounded" /><div className="space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-28" /></div></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !q) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Ticket non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le ticket demandé n&apos;existe pas ou a été annulé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/queue')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la file
        </Button>
      </div>
    )
  }

  const status = (q.status as string) || 'WAITING'
  const priority = (q.priority as string) || 'NORMAL'
  const ticketNumber = (q.ticketNumber as string) || ''
  const notes = (q.notes as string) || ''
  const arrivedAt = (q.arrivedAt as string) || ''
  const startedAt = (q.startedAt as string) || ''
  const completedAt = (q.completedAt as string) || ''
  const queueId = (q.id as string) || id
  const patientId = (q.patientId as string) || ''
  const assignedDoctorId = (q.assignedDoctorId as string) || ''
  const facilityId = (q.facilityId as string) || ''
  const consultationId = (q.consultationId as string) || ''

  const patientItems = ((patientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const userItems = ((usersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const facilityItems = ((facilitiesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  const doctorUsers = userItems.filter((u) => DOCTOR_ROLES.includes(String(u.role || '')))

  const patient = patientItems.find((p) => p.id === patientId)
  const doctor = userItems.find((u) => u.id === assignedDoctorId)
  const facility = facilityItems.find((f) => f.id === facilityId)

  const patientName = patient
    ? `${patient.firstName || patient.firstname || ''} ${patient.lastName || patient.lastname || ''}`.trim() || 'Inconnu'
    : `${q.patientFirstname || ''} ${q.patientLastname || ''}`.trim() || 'Inconnu'
  const doctorName = doctor
    ? `${doctor.firstName || doctor.firstname || ''} ${doctor.lastName || doctor.lastname || ''}`.trim() || 'Inconnu'
    : `${q.doctorFirstname || ''} ${q.doctorLastname || ''}`.trim() || 'Inconnu'
  const facilityName = (facility?.name as string) || 'Inconnu'

  const statusActions: { label: string; status: string; icon: React.ReactNode }[] = []
  if (status === 'WAITING') {
    statusActions.push({ label: 'Appeler', status: 'WITH_DOCTOR', icon: <Phone className="mr-2 h-4 w-4" /> })
  }
  if (status === 'WITH_DOCTOR') {
    statusActions.push({ label: 'Envoyer au labo', status: 'WITH_LAB', icon: <FlaskConical className="mr-2 h-4 w-4" /> })
  }
  if (status === 'WITH_LAB') {
    statusActions.push({ label: 'Envoyer en pharmacie', status: 'WITH_PHARMACY', icon: <Pill className="mr-2 h-4 w-4" /> })
  }
  if (status === 'WITH_PHARMACY') {
    statusActions.push({ label: 'Terminer', status: 'COMPLETED', icon: <CheckCircle className="mr-2 h-4 w-4" /> })
  }
  if (status !== 'COMPLETED' && status !== 'CANCELLED') {
    statusActions.push({ label: 'Annuler', status: 'CANCELLED', icon: <AlertCircle className="mr-2 h-4 w-4" /> })
  }

  const openEditDialog = () => {
    editForm.reset({
      priority: priority as QueueEditValues['priority'],
      assignedDoctorId,
      notes,
      status: status as QueueEditValues['status'],
    })
    setEditDialogOpen(true)
  }

  const onUpdate = editForm.handleSubmit(async (values) => {
    setSaving(true)
    try {
      await updateQueue.mutateAsync({
        id: queueId,
        data: toQueueEditPayload(values),
      })
      toast({ title: 'Ticket mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le ticket.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateQueue.mutateAsync({
        id: queueId,
        data: { status: newStatus },
      })
      toast({ title: 'Statut mis à jour', description: `Le ticket est maintenant "${statusConfig[newStatus]?.label || newStatus}".` })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de changer le statut.', variant: 'destructive' })
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
            onClick={() => router.push('/queue')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Ticket {ticketNumber}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={statusConfig[status]?.color || 'bg-gray-100 text-gray-700'}>
                {statusConfig[status]?.label || status}
              </Badge>
              <Badge className={priorityConfig[priority]?.color || 'bg-gray-100 text-gray-700'}>
                {priorityConfig[priority]?.label || priority}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can('queue:manage') && (
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          )}
          {can('queue:manage') && statusActions.map((action) => (
            <Button
              key={action.status + action.label}
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(action.status)}
              disabled={updateQueue.isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                  {patientId ? (
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
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Établissement</p>
                  <p className="text-sm font-medium text-foreground">{facilityName}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Priorité</p>
                  <p className="text-sm font-medium text-foreground">{priorityConfig[priority]?.label || priority}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="text-sm font-medium text-foreground">{statusConfig[status]?.label || status}</p>
                </div>
              </div>

              {consultationId && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground">Arrivé le</p>
                  <p className="text-sm text-foreground">{formatDate(arrivedAt)}</p>
                </div>
              </div>

              {startedAt && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Commencé le</p>
                    <p className="text-sm text-foreground">{formatDate(startedAt)}</p>
                  </div>
                </div>
              )}

              {completedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Terminé le</p>
                    <p className="text-sm text-foreground">{formatDate(completedAt)}</p>
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
            <DialogTitle>Modifier le ticket</DialogTitle>
            <DialogDescription>
              Modifiez les détails du ticket ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Controller
                control={editForm.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{priorityConfig[p]?.label || p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {editForm.formState.errors.priority && (
                <p className="text-xs text-destructive">{editForm.formState.errors.priority.message}</p>
              )}
            </div>
            {can('queue:assign') && (
            <div className="space-y-2">
              <Label htmlFor="assignedDoctor">Médecin assigné</Label>
              <Controller
                control={editForm.control}
                name="assignedDoctorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="assignedDoctor">
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorUsers.map((u: Record<string, unknown>) => (
                        <SelectItem key={u.id as string} value={u.id as string}>
                          {u.firstName || u.firstname || u.lastName || u.lastname ? `${u.firstName || u.firstname || ''} ${u.lastName || u.lastname || ''}`.trim() : '—'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Controller
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUEUE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {editForm.formState.errors.status && (
                <p className="text-xs text-destructive">{editForm.formState.errors.status.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...editForm.register('notes')} />
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
