'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, RefreshCw, User, Check, Edit, Trash2, LogOut, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBedsData,
  useCreateBed,
  useUpdateBed,
  useDeleteBed,
  useAssignBed,
  useReleaseBed,
  usePatientsData,
} from '@/hooks/use-data'
import { formatDate } from '@/lib/utils'

const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE', 'RESERVED'] as const
const BED_TYPES = ['WARD', 'PRIVATE', 'SEMI_PRIVATE', 'ICU', 'MATERNITY', 'PEDIATRIC', 'OTHER'] as const

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Libre',
  OCCUPIED: 'Occupé',
  CLEANING: 'En nettoyage',
  OUT_OF_SERVICE: 'Hors service',
  RESERVED: 'Réservé',
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  OCCUPIED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CLEANING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  OUT_OF_SERVICE: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  RESERVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

const typeLabels: Record<string, string> = {
  WARD: 'Dortoir',
  PRIVATE: 'Privé',
  SEMI_PRIVATE: 'À 2 places',
  ICU: 'Réanimation',
  MATERNITY: 'Maternité',
  PEDIATRIC: 'Pédiatrie',
  OTHER: 'Autre',
}

const createBedSchema = z.object({
  bedNumber: z.string().min(1, 'Le numéro de lit est requis'),
  room: z.string().nullish(),
  floor: z.string().nullish(),
  department: z.string().nullish(),
  label: z.string().nullish(),
  type: z.enum(BED_TYPES).nullish(),
  notes: z.string().nullish(),
})

type CreateBedValues = z.infer<typeof createBedSchema>

interface BedItem {
  id: string
  facilityId?: string
  bedNumber?: string
  room?: string
  floor?: string
  department?: string
  label?: string
  type?: string
  status?: string
  isActive?: boolean
  createdAt?: string
  assignmentId?: string | null
  patientId?: string | null
  patientFirstname?: string | null
  patientLastname?: string | null
  assignedAt?: string | null
  [key: string]: unknown
}

interface PatientItem {
  id: string
  firstname?: string
  lastname?: string
  dossierNumber?: string
  sex?: string
  dateOfBirth?: string
  isActive?: boolean
  [key: string]: unknown
}

export { BedManagerView }
export default function BedManagerView() {
  const { toast } = useToast()
  const { can } = usePermissions()

  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editBed, setEditBed] = useState<BedItem | null>(null)
  const [bedToAssign, setBedToAssign] = useState<BedItem | null>(null)
  const [assignSearch, setAssignSearch] = useState('')

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (departmentFilter) params.set('department', departmentFilter)
    if (search) params.set('search', search)
    params.set('isActive', 'true')
    return params.toString()
  }, [statusFilter, departmentFilter, search])

  const { data, isLoading, refetch } = useBedsData(queryParams)
  const items: BedItem[] = (data?.items as BedItem[]) || []

  const assignParams = useMemo(() => {
    const p = new URLSearchParams()
    if (assignSearch) p.set('search', assignSearch)
    p.set('isActive', 'true')
    return p.toString()
  }, [assignSearch])
  const { data: patientData, isLoading: patientsLoading } = usePatientsData(undefined, assignParams)
  const patients: PatientItem[] = (patientData?.items as PatientItem[]) || []

  const createBed = useCreateBed()
  const updateBed = useUpdateBed()
  const deleteBed = useDeleteBed()
  const assignBed = useAssignBed()
  const releaseBed = useReleaseBed()

  const onCreate = async (values: CreateBedValues) => {
    try {
      if (editBed) {
        await updateBed.mutateAsync({ id: editBed.id, data: values })
        toast({ title: 'Lit mis à jour', description: `Le lit ${values.bedNumber} a été modifié.` })
      } else {
        await createBed.mutateAsync(values)
        toast({ title: 'Lit créé', description: `Le lit ${values.bedNumber} a été ajouté à l'établissement.` })
      }
      setCreateOpen(false)
      setEditBed(null)
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible d\'enregistrer le lit.', variant: 'destructive' })
    }
  }

  const onDelete = async (bed: BedItem) => {
    try {
      await deleteBed.mutateAsync(bed.id)
      toast({ title: 'Lit désactivé', description: `Le lit ${bed.bedNumber} a été désactivé.` })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible de désactiver le lit.', variant: 'destructive' })
    }
  }

  const onAssign = async (patient: PatientItem) => {
    if (!bedToAssign) return
    try {
      await assignBed.mutateAsync({ id: bedToAssign.id, data: { patientId: patient.id } })
      toast({
        title: 'Patient admis',
        description: `${patient.firstname} ${patient.lastname} a été admis·e au lit ${bedToAssign.bedNumber}.`,
      })
      setAssignOpen(false)
      setBedToAssign(null)
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible d\'assigner le patient.', variant: 'destructive' })
    }
  }

  const onRelease = async (bed: BedItem) => {
    try {
      await releaseBed.mutateAsync(bed.id)
      toast({ title: 'Lit libéré', description: `Le lit ${bed.bedNumber} est de nouveau disponible.` })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message || 'Impossible de libérer le lit.', variant: 'destructive' })
    }
  }

  const canEdit = can('hospitalization:create') || can('hospitalization:edit') || can('episodes:edit')
  const canDelete = can('hospitalization:delete')
  const canAssign = can('hospitalization:assign') || can('episodes:edit')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plan de lits — Hospitalisation</CardTitle>
            <CardDescription>Gestion en temps réel des lits et de leurs affectations patient.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditBed(null); setCreateOpen(true) }}>
                <Plus className="h-4 w-4 mr-1" /> Nouveau lit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un lit, une chambre ou un patient…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {BED_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Département" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full sm:w-40" />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lit</TableHead>
                  <TableHead>Chambre / Étage</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun lit pour le moment.</TableCell></TableRow>
                ) : items.map((bed) => {
                  const occupied = bed.status === 'OCCUPIED' && bed.assignmentId
                  const patientName = bed.patientFirstname || bed.patientLastname
                    ? `${bed.patientFirstname || ''} ${bed.patientLastname || ''}`.trim()
                    : ''
                  return (
                    <TableRow key={bed.id}>
                      <TableCell className="font-medium">{bed.bedNumber}{bed.label ? ` — ${bed.label}` : ''}</TableCell>
                      <TableCell>{bed.room ? `Ch ${bed.room}` : '—'}{bed.floor ? ` / Étage ${bed.floor}` : ''}</TableCell>
                      <TableCell>{bed.department || '—'}</TableCell>
                      <TableCell>{bed.type ? typeLabels[bed.type] : '—'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[bed.status || 'AVAILABLE']}>{statusLabels[bed.status || 'AVAILABLE']}</Badge>
                      </TableCell>
                      <TableCell>
                        {occupied ? (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span>{patientName || 'Patient'}</span>
                            {bed.assignedAt ? <span className="text-xs text-muted-foreground">({formatDate(bed.assignedAt)})</span> : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {canAssign && bed.status !== 'OCCUPIED' && (
                          <Button size="sm" variant="outline" onClick={() => { setBedToAssign(bed); setAssignOpen(true) }}>
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                        {canAssign && bed.status === 'OCCUPIED' && bed.assignmentId && (
                          <Button size="sm" variant="outline" onClick={() => onRelease(bed)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button size="sm" variant="ghost" onClick={() => { setEditBed(bed); setCreateOpen(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la désactivation du lit {bed.bedNumber} ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action détache le lit de l'établissement. La file d'attente et les séjours associés sont conservés.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(bed)}>Désactiver</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen || !!editBed} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditBed(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBed ? 'Modifier le lit' : 'Nouveau lit'}</DialogTitle>
            <DialogDescription>{editBed ? 'Mettez à jour les informations du lit.' : "Définissez le numéro, la chambre et le type du nouveau lit."}</DialogDescription>
          </DialogHeader>
          <BedForm onSubmit={onCreate} defaultValues={editBed as any} onCancel={() => { setCreateOpen(false); setEditBed(null) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assigner un patient — Lit {bedToAssign?.bedNumber}</DialogTitle>
            <DialogDescription>Recherchez un patient à admettre dans ce lit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Nom / numéro de dossier du patient…" value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} className="pl-8" />
            </div>
            {patientsLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun patient correspondant.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded">
                {patients.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer" onClick={() => onAssign(p)}>
                    <div>
                      <p className="font-medium">{p.firstname} {p.lastname}</p>
                      <p className="text-sm text-muted-foreground">Dossier {p.dossierNumber} · {p.sex} · {p.dateOfBirth ? formatDate(p.dateOfBirth) : ''}</p>
                    </div>
                    <Button size="sm" variant="ghost"><Check className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BedForm({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues?: Partial<CreateBedValues>
  onCancel: () => void
  onSubmit: (values: CreateBedValues) => Promise<void>
}) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<CreateBedValues>({
    resolver: zodResolver(createBedSchema),
    defaultValues: { bedNumber: '', room: '', floor: '', department: '', label: '', type: undefined, notes: '' as any, ...defaultValues } as any,
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedNumber">Numéro de lit *</Label>
          <Input id="bedNumber" {...register('bedNumber')} className={errors.bedNumber ? 'border-destructive' : ''} />
          {errors.bedNumber && <p className="text-xs text-destructive">{errors.bedNumber.message}</p>}
        </div>
        <div>
          <Label htmlFor="room">Chambre</Label>
          <Input id="room" {...register('room')} />
        </div>
        <div>
          <Label htmlFor="floor">Étage</Label>
          <Input id="floor" {...register('floor')} />
        </div>
        <div>
          <Label htmlFor="department">Département</Label>
          <Input id="department" {...register('department')} />
        </div>
        <div>
          <Label htmlFor="label">Libellé</Label>
          <Input id="label" {...register('label')} placeholder="ex: Lit 2A" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select defaultValue={defaultValues?.type} onValueChange={(v) => (register('type') as any).onChange({ target: { name: 'type', value: v } })}>
            <SelectTrigger id="type"><SelectValue placeholder="Type de lit" /></SelectTrigger>
            <SelectContent>
              {BED_TYPES.map((t) => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} type="button">Annuler</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}
