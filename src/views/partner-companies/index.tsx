'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partnerCompanyCreateSchema, type PartnerCompanyCreateValues } from '@/lib/schemas'
import { Search, Plus, Building2, Phone, Mail, Globe, MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react'
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
import { usePartnerCompaniesData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface PartnerCompanyItem {
  id: string
  code: string
  name: string
  sector?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  contactName?: string
  contactFunction?: string
  contactPhone?: string
  contactEmail?: string
  contractNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  contractStatus: string
  coverageRate?: number
  annualCeiling?: number
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const contractStatusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  SUSPENDED: 'Suspendu',
}

const contractStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
}

export default function PartnerCompaniesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createForm = useForm<PartnerCompanyCreateValues>({
    resolver: zodResolver(partnerCompanyCreateSchema),
    defaultValues: { country: 'RD Congo', contractStatus: 'ACTIVE' },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = usePartnerCompaniesData(paramsStr)
  const items = (data?.items ?? []) as PartnerCompanyItem[]
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 10)

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      const res = await fetch(`/api/v1/partner-companies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        toast({ title: 'Succès', description: 'Entreprise partenaire désactivée' })
        setDeletingId(null)
      } else {
        const err = await res.json()
        toast({ title: 'Erreur', description: err.message || 'Impossible de supprimer', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'entreprise', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entreprises partenaires</h1>
          <p className="text-muted-foreground">Gestion des partenaires et contrats</p>
        </div>
        {can('patients:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle entreprise
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entreprise..."
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
            {Object.entries(contractStatusLabels).map(([key, label]) => (
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
                <TableHead>Code</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Statut du contrat</TableHead>
                <TableHead>Fin du contrat</TableHead>
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
                    Aucune entreprise partenaire trouvée
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.sector || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={contractStatusColors[item.contractStatus] || ''}>
                        {contractStatusLabels[item.contractStatus] || item.contractStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.contractEndDate ? formatDate(item.contractEndDate) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/partner-companies/${item.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(item.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Désactiver
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
          <p className="text-sm text-muted-foreground">{total} entreprise(s)</p>
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
            <DialogTitle>Nouvelle entreprise partenaire</DialogTitle>
            <DialogDescription>Ajouter une nouvelle entreprise partenaire</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(async (values) => {
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch('/api/v1/partner-companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Entreprise partenaire créée' })
                setShowCreateDialog(false)
                createForm.reset()
              } else {
                const err = await res.json()
                toast({ title: 'Erreur', description: err.message || 'Impossible de créer', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible de créer l\'entreprise', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Code *</label>
                <Input {...createForm.register('code')} placeholder="EX: PART-001" />
              </div>
              <div>
                <label className="text-sm font-medium">Nom *</label>
                <Input {...createForm.register('name')} placeholder="Nom de l'entreprise" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Secteur</label>
                <Input {...createForm.register('sector')} placeholder="Secteur d'activité" />
              </div>
              <div>
                <label className="text-sm font-medium">Pays</label>
                <Input {...createForm.register('country')} placeholder="RD Congo" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input {...createForm.register('phone')} placeholder="+243..." />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" {...createForm.register('email')} placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">N° Contrat</label>
                <Input {...createForm.register('contractNumber')} placeholder="Numéro de contrat" />
              </div>
              <div>
                <label className="text-sm font-medium">Statut du contrat</label>
                <Controller
                  control={createForm.control}
                  name="contractStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(contractStatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Début du contrat</label>
                <Input type="date" {...createForm.register('contractStartDate')} />
              </div>
              <div>
                <label className="text-sm font-medium">Fin du contrat</label>
                <Input type="date" {...createForm.register('contractEndDate')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Taux de couverture (%)</label>
              <Input type="number" {...createForm.register('coverageRate', { valueAsNumber: true })} placeholder="100" />
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
            <AlertDialogTitle>Confirmer la désactivation</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir désactiver cette entreprise partenaire ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) handleDelete(deletingId) }} className="bg-destructive text-destructive-foreground">Désactiver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}