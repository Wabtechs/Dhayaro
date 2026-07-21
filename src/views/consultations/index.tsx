'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react'
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
  useConsultationsData,
  usePatientsData,
  useUsersData,
  useFacilitiesData,
  useUpdateConsultation,
  useDeleteConsultation,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { api } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

const statusConfig: Record<string, { label: string; color: string }> = {
  WAITING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

interface ConsultationItem {
  id: string
  facilityId?: string
  patientId: string
  doctorId: string
  consultationNumber: string
  motif: string
  symptoms: string[]
  vitalSigns: Record<string, unknown>
  notes?: string
  provisionalDiagnosis?: string
  status: string
  isFollowUp?: boolean
  previousConsultationId?: string
  createdAt: string
  updatedAt: string
  patientFirstname?: string
  patientLastname?: string
  doctorFirstname?: string
  doctorLastname?: string
  patientName?: string
  doctorName?: string
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

interface FacilityItem {
  id: string
  name: string
  [key: string]: unknown
}

export { ConsultationsView }
export default function ConsultationsView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useConsultationsData(
    search ? `search=${search}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}` : (statusFilter !== 'all' ? `status=${statusFilter}` : '')
  )

  const { data: patientsData } = usePatientsData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()

  const updateConsultation = useUpdateConsultation()
  const deleteConsultation = useDeleteConsultation()

  const patientsList = (patientsData?.items ?? []) as PatientItem[]
  const usersList = (usersData?.items ?? []) as UserItem[]
  const facilitiesList = (facilitiesData?.items ?? []) as FacilityItem[]

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as ConsultationItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (!search) return true
      return (
        String(item.patientName || item.patient || '').toLowerCase().includes(q) ||
        String(item.doctorName || item.doctor || '').toLowerCase().includes(q) ||
        String(item.motif || item.reason || '').toLowerCase().includes(q) ||
        String(item.consultationNumber || item.id || '').toLowerCase().includes(q)
      )
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<ConsultationItem | null>(null)

  const [newConsultation, setNewConsultation] = useState({
    patientId: '',
    doctorId: '',
    motif: '',
    symptoms: '',
    notes: '',
    provisionalDiagnosis: '',
    status: 'WAITING' as string,
    isFollowUp: false,
    facilityId: '',
  })

  const [editForm, setEditForm] = useState({
    motif: '',
    notes: '',
    provisionalDiagnosis: '',
    status: 'WAITING' as string,
    doctorId: '',
  })

  const handleCreate = async () => {
    if (!newConsultation.patientId || !newConsultation.doctorId || !newConsultation.motif) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/consultations', {
        patientId: sanitizeUuid(newConsultation.patientId),
        doctorId: sanitizeUuid(newConsultation.doctorId),
        motif: newConsultation.motif,
        symptoms: newConsultation.symptoms ? newConsultation.symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
        notes: newConsultation.notes || null,
        provisionalDiagnosis: newConsultation.provisionalDiagnosis || null,
        status: newConsultation.status || 'WAITING',
        isFollowUp: newConsultation.isFollowUp,
        facilityId: sanitizeUuid(newConsultation.facilityId) || null,
      }, token)
      await queryClient.invalidateQueries({ queryKey: ['consultations'] })
      toast({ title: 'Consultation créée', description: `"${newConsultation.motif}" a été enregistrée.` })
      setDialogOpen(false)
      setNewConsultation({ patientId: '', doctorId: '', motif: '', symptoms: '', notes: '', provisionalDiagnosis: '', status: 'WAITING', isFollowUp: false, facilityId: '' })
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la consultation.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (c: ConsultationItem) => {
    setEditingConsultation(c)
    setEditForm({
      motif: (c.motif as string) || '',
      notes: (c.notes as string) || '',
      provisionalDiagnosis: (c.provisionalDiagnosis as string) || '',
      status: (c.status as string) || 'WAITING',
      doctorId: (c.doctorId as string) || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingConsultation) return
    setSaving(true)
    try {
      await updateConsultation.mutateAsync({
        id: editingConsultation.id as string,
        data: {
          motif: editForm.motif,
          doctorId: sanitizeUuid(editForm.doctorId) || undefined,
          notes: editForm.notes || null,
          provisionalDiagnosis: editForm.provisionalDiagnosis || null,
          status: editForm.status,
        },
      })
      toast({ title: 'Consultation mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
      setEditingConsultation(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la consultation.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: ConsultationItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler cette consultation "${c.consultationNumber}" ?`)) return
    try {
      await deleteConsultation.mutateAsync(c.id as string)
      toast({ title: 'Consultation annulée', description: `"${c.consultationNumber}" a été annulée.` })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler la consultation.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Consultations</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} consultation{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('consultations:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Consultation
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Consultation</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour enregistrer une nouvelle consultation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient *</label>
                  <Select value={newConsultation.patientId} onValueChange={(v) => setNewConsultation({ ...newConsultation, patientId: v })}>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Médecin *</label>
                  <Select value={newConsultation.doctorId} onValueChange={(v) => setNewConsultation({ ...newConsultation, doctorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList.filter((u) => u.role === 'DOCTOR').map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Établissement</label>
                <Select value={newConsultation.facilityId} onValueChange={(v) => setNewConsultation({ ...newConsultation, facilityId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilitiesList.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Motif *</label>
                <Input
                  placeholder="Motif de la consultation"
                  value={newConsultation.motif}
                  onChange={(e) => setNewConsultation({ ...newConsultation, motif: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Symptômes (séparés par des virgules)</label>
                <Input
                  placeholder="Ex: Fièvre, Toux"
                  value={newConsultation.symptoms}
                  onChange={(e) => setNewConsultation({ ...newConsultation, symptoms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Diagnostic provisoire</label>
                <Input
                  placeholder="Diagnostic provisoire"
                  value={newConsultation.provisionalDiagnosis}
                  onChange={(e) => setNewConsultation({ ...newConsultation, provisionalDiagnosis: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={newConsultation.status} onValueChange={(v) => setNewConsultation({ ...newConsultation, status: v })}>
                    <SelectTrigger>
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
                <div className="flex items-end space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={newConsultation.isFollowUp}
                      onChange={(e) => setNewConsultation({ ...newConsultation, isFollowUp: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Consultation de suivi
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes cliniques"
                  rows={3}
                  value={newConsultation.notes}
                  onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" disabled={creating || !newConsultation.patientId || !newConsultation.doctorId || !newConsultation.motif} onClick={handleCreate}>
                {creating ? 'Création...' : 'Créer la consultation'}
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
                placeholder="Rechercher une consultation..."
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
                  <SelectItem value="WAITING">En attente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
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
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune consultation disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Consultation</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item: ConsultationItem) => {
                    const status = String(item.status || '').toUpperCase()
                    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/consultations/${item.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {String(item.consultationNumber || item.id || '—')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.patientName || item.patient || '—')}
                        </TableCell>
                        <TableCell>{String(item.doctorName || item.doctor || '—')}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {String(item.motif || item.reason || '—')}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt as string)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {can('consultations:edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            )}
                            {can('consultations:delete') && (
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
                              onClick={() => router.push(`/consultations/${item.id}`)}
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
            <DialogTitle>Modifier la consultation</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la consultation ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif *</label>
              <Input
                value={editForm.motif}
                onChange={(e) => setEditForm({ ...editForm, motif: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Diagnostic provisoire</label>
              <Input
                value={editForm.provisionalDiagnosis}
                onChange={(e) => setEditForm({ ...editForm, provisionalDiagnosis: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Médecin</label>
              <Select value={editForm.doctorId} onValueChange={(v) => setEditForm({ ...editForm, doctorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {usersList.filter((u) => u.role === 'DOCTOR').map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
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
    </div>
  )
}
