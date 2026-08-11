'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { careCoverageCreateSchema, type CareCoverageCreateValues } from '@/lib/schemas'
import { Search, Plus, Shield, Clock, DollarSign, AlertTriangle, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
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
import { useCareCoveragesData, usePatientsData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface CareCoverageItem {
  id: string
  patientId: string
  coverageType: string
  organization?: string
  contractNumber?: string
  coverageRate?: number
  coverageCeiling?: number
  remainingAmount?: number
  validFrom?: string
  validUntil?: string
  status: string
  justification?: string
  isActive: boolean
  patientFirstname?: string
  patientLastname?: string
  createdAt: string
  updatedAt: string
}

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
}

const coverageTypeLabels: Record<string, string> = {
  PERSONAL: 'Personnel',
  INSURANCE: 'Assurance',
  MUTUAL: 'Mutuelle',
  COMPANY: 'Entreprise',
  NGO: 'ONG',
  GOVERNMENT: 'Gouvernement',
  HEALTH_PROJECT: 'Projet de santé',
  PARTNER: 'Partenaire',
  FREE: 'Gratuit',
  OTHER: 'Autre',
}

const coverageStatusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu',
}

const coverageStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
}

export default function CareCoveragesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createForm = useForm<CareCoverageCreateValues>({
    resolver: zodResolver(careCoverageCreateSchema),
    defaultValues: { patientId: '', coverageType: 'PERSONAL' },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (typeFilter && typeFilter !== 'all') params.set('coverageType', typeFilter)
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = useCareCoveragesData(paramsStr)
  const { data: patientsData } = usePatientsData()

  const items = (data?.items ?? []) as CareCoverageItem[]
  const total = data?.total ?? 0
  const patients = (patientsData?.items ?? []) as PatientItem[]

  const totalPages = Math.ceil(total / 10)

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await fetch(`/api/v1/care-coverages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      toast({ title: 'Succès', description: 'Couverture supprimée' })
      setDeletingId(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la couverture', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prises en charge</h1>
          <p className="text-muted-foreground">Gestion des couvertures de soins</p>
        </div>
        {can('patients:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle couverture
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(coverageTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(coverageStatusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune couverture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {item.patientFirstname} {item.patientLastname}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{coverageTypeLabels[item.coverageType] || item.coverageType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.organization || '—'}</TableCell>
                    <TableCell>
                      {item.coverageRate ? <div className="flex items-center gap-1 text-sm"><DollarSign className="h-3 w-3 text-muted-foreground" />{item.coverageRate}%</div> : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={coverageStatusColors[item.status] || ''}>
                        {coverageStatusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.validFrom ? formatDate(item.validFrom) : '—'}
                      {item.validUntil && item.validFrom ? ' → ' : ''}
                      {item.validUntil ? formatDate(item.validUntil) : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/patients/${item.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(item.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} couverture(s)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle couverture de soins</DialogTitle>
            <DialogDescription>Ajouter une prise en charge pour un patient</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(async (values) => {
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch('/api/v1/care-coverages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Couverture créée' })
                setShowCreateDialog(false)
                createForm.reset()
              } else {
                toast({ title: 'Erreur', description: 'Impossible de créer la couverture. Vérifiez les informations saisies puis réessayez.', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible de créer la couverture', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Patient *</label>
              <Controller
                control={createForm.control}
                name="patientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName || p.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Patient'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type de couverture *</label>
              <Controller
                control={createForm.control}
                name="coverageType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(coverageTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Organisation</label>
                <Input {...createForm.register('organization')} placeholder="Nom de l'organisation" />
              </div>
              <div>
                <label className="text-sm font-medium">N° Contrat</label>
                <Input {...createForm.register('contractNumber')} placeholder="Numéro de contrat" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Taux de couverture (%)</label>
                <Input type="number" {...createForm.register('coverageRate', { valueAsNumber: true })} placeholder="100" />
              </div>
              <div>
                <label className="text-sm font-medium">Plafond (CDF)</label>
                <Input type="number" {...createForm.register('coverageCeiling', { valueAsNumber: true })} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valide du</label>
                <Input type="date" {...createForm.register('validFrom')} />
              </div>
              <div>
                <label className="text-sm font-medium">Valide jusqu'au</label>
                <Input type="date" {...createForm.register('validUntil')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Justification</label>
              <Input {...createForm.register('justification')} placeholder="Motif de la couverture" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette couverture de soins ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) handleDelete(deletingId) }} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}