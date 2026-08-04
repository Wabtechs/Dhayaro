'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partnerPatientCreateSchema, type PartnerPatientCreateValues } from '@/lib/schemas'
import { Search, Plus, Users, Building2, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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
import { usePartnerPatientsData, usePartnerCompaniesData, usePatientsData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface PartnerCompanyItem {
  id: string
  name: string
  code: string
}

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
}

interface PartnerPatientItem {
  id: string
  partnerId: string
  patientId: string
  contractNumber?: string
  coverageRate?: number
  status: string
  notes?: string
  partnerName?: string
  partnerCode?: string
  patientFirstname?: string
  patientLastname?: string
  createdAt: string
  updatedAt: string
}

const partnerPatientStatusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu',
}

const partnerPatientStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
}

export default function PartnerPatientsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createForm = useForm<PartnerPatientCreateValues>({
    resolver: zodResolver(partnerPatientCreateSchema),
    defaultValues: { partnerId: '', patientId: '' },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = usePartnerPatientsData(paramsStr)
  const { data: partnersData } = usePartnerCompaniesData()
  const { data: patientsData } = usePatientsData()

  const items = (data?.items ?? []) as PartnerPatientItem[]
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 10)
  const partners = (partnersData?.items ?? []) as PartnerCompanyItem[]
  const patients = (patientsData?.items ?? []) as PatientItem[]

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      const res = await fetch(`/api/v1/partner-patients/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        toast({ title: 'Succès', description: 'Affiliation supprimée' })
        setDeletingId(null)
      } else {
        const err = await res.json()
        toast({ title: 'Erreur', description: err.message || 'Impossible de supprimer', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'affiliation', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients partenaires</h1>
          <p className="text-muted-foreground">Patients affiliés aux entreprises partenaires</p>
        </div>
        {can('patients:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle affiliation
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(partnerPatientStatusLabels).map(([key, label]) => (
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
                <TableHead>Entreprise</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>N° Contrat</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune affiliation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {item.partnerName || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {item.patientFirstname} {item.patientLastname}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.contractNumber || '—'}</TableCell>
                    <TableCell>
                      {item.coverageRate ? `${item.coverageRate}%` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={partnerPatientStatusColors[item.status] || ''}>
                        {partnerPatientStatusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/partner-patients/${item.id}`)}>
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
          <p className="text-sm text-muted-foreground">{total} affiliation(s)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle affiliation partenaire</DialogTitle>
            <DialogDescription>Associer un patient à une entreprise partenaire</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(async (values) => {
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch('/api/v1/partner-patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Affiliation créée' })
                setShowCreateDialog(false)
                createForm.reset()
              } else {
                const err = await res.json()
                toast({ title: 'Erreur', description: err.message || 'Impossible de créer', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible de créer l\'affiliation', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Entreprise partenaire *</label>
              <Controller
                control={createForm.control}
                name="partnerId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une entreprise" /></SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">N° Contrat</label>
                <Input {...createForm.register('contractNumber')} placeholder="Numéro de contrat" />
              </div>
              <div>
                <label className="text-sm font-medium">Taux de couverture (%)</label>
                <Input type="number" {...createForm.register('coverageRate', { valueAsNumber: true })} placeholder="100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Plafond annuel (CDF)</label>
                <Input type="number" {...createForm.register('annualCeiling', { valueAsNumber: true })} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Solde restant (CDF)</label>
                <Input type="number" {...createForm.register('remainingAmount', { valueAsNumber: true })} placeholder="0" />
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
              <label className="text-sm font-medium">Statut</label>
              <Controller
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(partnerPatientStatusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette affiliation ?</AlertDialogDescription>
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