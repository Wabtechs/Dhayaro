'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  ListOrdered,
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
  useQueueData,
  usePatientsData,
  useUsersData,
  useConsultationsData,
  useCreateQueue,
  useUpdateQueue,
  useDeleteQueue,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

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

interface QueueItem {
  id: string
  facilityId?: string
  patientId?: string
  consultationId?: string
  ticketNumber?: string
  priority?: string
  status?: string
  assignedDoctorId?: string
  queuePosition?: number
  estimatedWaitMinutes?: number
  arrivedAt?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  patientFirstname?: string
  patientLastname?: string
  patientPhone?: string
  doctorFirstname?: string
  doctorLastname?: string
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
  lastname?: string
  [key: string]: unknown
}

interface ConsultationItem {
  id: string
  consultationNumber?: string
  [key: string]: unknown
}

export { QueueView }
export default function QueueView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const queueParams = statusFilter !== 'all' ? `status=${statusFilter}&size=100` : 'size=100'
  const { data, isLoading } = useQueueData(queueParams)

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: consultationsData } = useConsultationsData()

  const createQueue = useCreateQueue()
  const updateQueue = useUpdateQueue()
  const deleteQueue = useDeleteQueue()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const consultationsList = (consultationsData?.items ?? []) as ConsultationItem[]

  const doctorUsers = usersList.filter((u) => DOCTOR_ROLES.includes(String(u.role || '')))

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as QueueItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (!search) return true
      const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim().toLowerCase()
      const doctorName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim().toLowerCase()
      return (
        String(item.ticketNumber || '').toLowerCase().includes(q) ||
        patientName.includes(q) ||
        doctorName.includes(q)
      )
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingQueue, setEditingQueue] = useState<QueueItem | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [newQueue, setNewQueue] = useState({
    patientId: '',
    consultationId: '',
    assignedDoctorId: '',
    priority: 'NORMAL' as string,
    estimatedWaitMinutes: '',
    notes: '',
  })

  const [editForm, setEditForm] = useState({
    priority: 'NORMAL' as string,
    assignedDoctorId: '',
    notes: '',
    status: 'WAITING' as string,
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      const patientUuid = sanitizeUuid(newQueue.patientId)
      if (!patientUuid) {
        toast({ title: 'Erreur', description: 'Veuillez sélectionner un patient.', variant: 'destructive' })
        return
      }
      await createQueue.mutateAsync({
        patientId: patientUuid,
        consultationId: sanitizeUuid(newQueue.consultationId) || undefined,
        assignedDoctorId: sanitizeUuid(newQueue.assignedDoctorId) || undefined,
        priority: newQueue.priority || 'NORMAL',
        estimatedWaitMinutes: newQueue.estimatedWaitMinutes ? Number(newQueue.estimatedWaitMinutes) : undefined,
        notes: newQueue.notes || null,
      })
      toast({ title: 'Ticket créé', description: 'Le ticket a été ajouté à la file d\'attente.' })
      setDialogOpen(false)
      setNewQueue({ patientId: '', consultationId: '', assignedDoctorId: '', priority: 'NORMAL', estimatedWaitMinutes: '', notes: '' })
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le ticket.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (q: QueueItem) => {
    setEditingQueue(q)
    setEditForm({
      priority: (q.priority as string) || 'NORMAL',
      assignedDoctorId: (q.assignedDoctorId as string) || '',
      notes: (q.notes as string) || '',
      status: (q.status as string) || 'WAITING',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingQueue) return
    setSaving(true)
    try {
      await updateQueue.mutateAsync({
        id: editingQueue.id as string,
        data: {
          priority: editForm.priority,
          assignedDoctorId: sanitizeUuid(editForm.assignedDoctorId) || null,
          notes: editForm.notes || null,
          status: editForm.status,
        },
      })
      toast({ title: 'Ticket mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingQueue(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le ticket.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (q: QueueItem) => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir annuler ce ticket "${q.ticketNumber}" ?`,
      callback: async () => {
        try {
          await deleteQueue.mutateAsync(q.id as string)
          await queryClient.invalidateQueries({ queryKey: ['queue'] })
          toast({ title: 'Ticket annulé', description: `"${q.ticketNumber}" a été annulé.` })
        } catch {
          toast({ title: 'Erreur', description: 'Impossible d\'annuler le ticket.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">File d&apos;attente</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} entrée{filtered.length > 1 ? 's' : ''} dans la file
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('queue:manage') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Ticket
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Ticket</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour ajouter un patient à la file d&apos;attente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Select value={newQueue.patientId} onValueChange={(v) => setNewQueue({ ...newQueue, patientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName || p.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation (optionnel)</label>
                  <Select value={newQueue.consultationId} onValueChange={(v) => setNewQueue({ ...newQueue, consultationId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {String(c.consultationNumber || c.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Médecin assigné</label>
                <Select value={newQueue.assignedDoctorId} onValueChange={(v) => setNewQueue({ ...newQueue, assignedDoctorId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un médecin (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={newQueue.priority} onValueChange={(v) => setNewQueue({ ...newQueue, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Faible</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">Élevée</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temps d&apos;attente estimé (min)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex: 15"
                    value={newQueue.estimatedWaitMinutes}
                    onChange={(e) => setNewQueue({ ...newQueue, estimatedWaitMinutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes éventuelles"
                  rows={3}
                  value={newQueue.notes}
                  onChange={(e) => setNewQueue({ ...newQueue, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newQueue.patientId} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer le ticket'}
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
                placeholder="Rechercher un ticket, patient ou médecin..."
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="WAITING">En attente</SelectItem>
                  <SelectItem value="WITH_DOCTOR">Chez le médecin</SelectItem>
                  <SelectItem value="WITH_LAB">Au laboratoire</SelectItem>
                  <SelectItem value="WITH_PHARMACY">À la pharmacie</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune entrée dans la file d&apos;attente</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Ticket</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Date arrivée</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item: QueueItem) => {
                    const status = String(item.status || '').toUpperCase()
                    const priority = String(item.priority || '').toUpperCase()
                    const sConfig = statusConfig[status] || { label: status || '—', color: 'bg-gray-100 text-gray-700' }
                    const pConfig = priorityConfig[priority] || { label: priority || '—', color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim() || '—'
                    const doctorName = `${item.doctorFirstname || ''} ${item.doctorLastname || ''}`.trim() || '—'
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/queue/${item.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {String(item.ticketNumber || item.id || '—')}
                        </TableCell>
                        <TableCell className="font-medium">{patientName}</TableCell>
                        <TableCell>
                          <Badge className={pConfig.color}>{pConfig.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={sConfig.color}>{sConfig.label}</Badge>
                        </TableCell>
                        <TableCell>{doctorName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.arrivedAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('queue:manage') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('queue:manage') && (
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
                              onClick={() => router.push(`/queue/${item.id}`)}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le ticket</DialogTitle>
            <DialogDescription>
              Modifiez les informations du ticket ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {can('queue:assign') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Médecin assigné</label>
              <Select value={editForm.assignedDoctorId} onValueChange={(v) => setEditForm({ ...editForm, assignedDoctorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {doctorUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAITING">En attente</SelectItem>
                  <SelectItem value="WITH_DOCTOR">Chez le médecin</SelectItem>
                  <SelectItem value="WITH_LAB">Au laboratoire</SelectItem>
                  <SelectItem value="WITH_PHARMACY">À la pharmacie</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDelete?.callback(); setConfirmDelete(null) }}>
              Annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
