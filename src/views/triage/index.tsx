'use client'

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Heart, Activity, Thermometer, Weight, Ruler, Droplets,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useQueueData, useUsersData, useSubmitTriage } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const DOCTOR_ROLES = ['DOCTOR', 'SPECIALIST', 'doctor', 'specialist']

interface QueueItem {
  id: string; patientId?: string; priority?: string; status?: string
  assignedDoctorId?: string; ticketNumber?: string; notes?: string
  arrivedAt?: string; estimatedWaitMinutes?: number; queuePosition?: number
  patientFirstname?: string; patientLastname?: string; patientPhone?: string
  doctorFirstname?: string; doctorLastname?: string
  [key: string]: unknown
}

export { TriageView }
export default function TriageView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: queueData, isLoading } = useQueueData('status=WAITING&size=50')
  const { data: usersData } = useUsersData()

  const submitTriage = useSubmitTriage()

  const usersList = ((usersData as Record<string, unknown>)?.items ?? []) as Record<string, unknown>[]
  const doctorUsers = usersList.filter((u) => DOCTOR_ROLES.includes(String(u.role || '')))

  const filtered = useMemo(() => {
    const allItems = ((queueData as Record<string, unknown>)?.items ?? []) as QueueItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      if (!q) return true
      const patientName = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim().toLowerCase()
      const ticket = String(item.ticketNumber || '').toLowerCase()
      return patientName.includes(q) || ticket.includes(q)
    })
  }, [queueData, search, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [triageOpen, setTriageOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [vitalSigns, setVitalSigns] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  })
  const [triagePriority, setTriagePriority] = useState('NORMAL')
  const [assignedDoctorId, setAssignedDoctorId] = useState('')
  const [motif, setMotif] = useState('')
  const [notes, setNotes] = useState('')

  const openTriage = (item: QueueItem) => {
    setSelectedPatient(item)
    setVitalSigns({
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
    })
    setTriagePriority(item.priority || 'NORMAL')
    setAssignedDoctorId(item.assignedDoctorId || '')
    setMotif('')
    setNotes(item.notes || '')
    setTriageOpen(true)
  }

  const getPatientName = (item: QueueItem): string => {
    const first = item.patientFirstname || ''
    const last = item.patientLastname || ''
    return `${first} ${last}`.trim() || '—'
  }

  const handleSubmit = async () => {
    if (!selectedPatient?.patientId || !assignedDoctorId || !motif) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' })
      return
    }
    if (!vitalSigns.bloodPressureSystolic && !vitalSigns.heartRate && !vitalSigns.temperature) {
      toast({ title: 'Erreur', description: 'Veuillez saisir au moins les signes vitaux principaux.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const vitals: Record<string, unknown> = {}
      if (vitalSigns.bloodPressureSystolic) {
        vitals.bloodPressure = `${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic || '?'}`
        vitals.bloodPressureSystolic = parseInt(vitalSigns.bloodPressureSystolic)
        vitals.bloodPressureDiastolic = vitalSigns.bloodPressureDiastolic ? parseInt(vitalSigns.bloodPressureDiastolic) : null
      }
      if (vitalSigns.heartRate) vitals.heartRate = parseInt(vitalSigns.heartRate)
      if (vitalSigns.temperature) vitals.temperature = parseFloat(vitalSigns.temperature)
      if (vitalSigns.respiratoryRate) vitals.respiratoryRate = parseInt(vitalSigns.respiratoryRate)
      if (vitalSigns.oxygenSaturation) vitals.oxygenSaturation = parseInt(vitalSigns.oxygenSaturation)
      if (vitalSigns.weight) vitals.weight = parseFloat(vitalSigns.weight)
      if (vitalSigns.height) vitals.height = parseInt(vitalSigns.height)

      await submitTriage.mutateAsync({
        queueId: selectedPatient.id,
        patientId: selectedPatient.patientId!,
        priority: triagePriority,
        assignedDoctorId,
        vitalSigns: vitals,
        motif,
        notes: notes || undefined,
      })

      toast({ title: 'Succès', description: 'Triage effectué avec succès. Patient envoyé en consultation.' })
      setTriageOpen(false)
      setSelectedPatient(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'effectuer le triage. Réessayez.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const waitingCount = ((queueData as Record<string, unknown>)?.items as QueueItem[] | undefined)?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triage</h1>
          <p className="text-sm text-muted-foreground">
            {waitingCount} patient(s) en attente de triage
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="LOW">Faible</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">Élevée</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Arrivée</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun patient en attente de triage
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => {
                  const pc = priorityConfig[item.priority || 'NORMAL'] || priorityConfig.NORMAL
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.ticketNumber || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{getPatientName(item)}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.arrivedAt ? formatDate(item.arrivedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={pc.color}>{pc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openTriage(item)}
                          disabled={!can('triage:manage')}
                        >
                          Effectuer le triage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Triage — {selectedPatient ? getPatientName(selectedPatient) : ''}</DialogTitle>
            <DialogDescription>
              Saisissez les signes vitaux et définissez la priorité
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Signes vitaux
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> Tension systolique
                  </Label>
                  <Input
                    placeholder="120"
                    type="number"
                    value={vitalSigns.bloodPressureSystolic}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, bloodPressureSystolic: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> Tension diastolique
                  </Label>
                  <Input
                    placeholder="80"
                    type="number"
                    value={vitalSigns.bloodPressureDiastolic}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, bloodPressureDiastolic: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Fréquence cardiaque
                  </Label>
                  <Input
                    placeholder="bpm"
                    type="number"
                    value={vitalSigns.heartRate}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, heartRate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Température
                  </Label>
                  <Input
                    placeholder="°C"
                    type="number"
                    step="0.1"
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, temperature: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Fréquence respiratoire
                  </Label>
                  <Input
                    placeholder="/min"
                    type="number"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, respiratoryRate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Saturation O2
                  </Label>
                  <Input
                    placeholder="%"
                    type="number"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, oxygenSaturation: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3 w-3" /> Poids
                  </Label>
                  <Input
                    placeholder="kg"
                    type="number"
                    step="0.1"
                    value={vitalSigns.weight}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, weight: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> Taille
                  </Label>
                  <Input
                    placeholder="cm"
                    type="number"
                    value={vitalSigns.height}
                    onChange={(e) => setVitalSigns((s) => ({ ...s, height: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Priorité</Label>
                <Select value={triagePriority} onValueChange={setTriagePriority}>
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
                <Label className="text-sm font-semibold">
                  Médecin traitant <span className="text-destructive">*</span>
                </Label>
                <Select value={assignedDoctorId} onValueChange={setAssignedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorUsers.map((u) => (
                      <SelectItem key={u.id as string} value={u.id as string}>
                        {u.firstname as string} {u.lastname as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Motif de consultation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Motif principal de la consultation"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Notes de triage</Label>
              <Textarea
                placeholder="Observations supplémentaires"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTriageOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'En cours...' : 'Valider le triage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
