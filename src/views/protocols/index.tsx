'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { protocolSchema, toProtocolPayload, type ProtocolValues } from '@/lib/schemas'
import { Search, Plus, FileCheck, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTherapeuticProtocolsData, useDiseasesData, useCreateTherapeuticProtocol, useDeleteTherapeuticProtocol } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

interface ProtocolItem {
  id: string
  name: string
  description?: string
  diseaseId?: string
  diseaseName?: string
  diseaseCode?: string
  steps: { order: number; description: string }[]
  targetPopulation?: string
  contraindications: string[]
  efficacyRate?: number
  isActive: boolean
  createdAt: string
}

export default function ProtocolsPage() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = useTherapeuticProtocolsData(paramsStr)
  const { data: diseasesData } = useDiseasesData()
  const createProtocol = useCreateTherapeuticProtocol()
  const deleteProtocol = useDeleteTherapeuticProtocol()

  const protocols = (data as { items?: ProtocolItem[]; total?: number })?.items ?? []
  const total = (data as { total?: number })?.total ?? 0
  const diseases = ((diseasesData as { items?: Array<{ id: string; name: string; code: string }> })?.items || [])

  const protocolForm = useForm<ProtocolValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues: { name: '', description: '', diseaseId: '', targetPopulation: '' },
  })

  const handleCreate = protocolForm.handleSubmit(async (values) => {
    try {
      await createProtocol.mutateAsync(toProtocolPayload(values))
      toast({ title: 'Succès', description: 'Protocole créé' })
      setShowCreateDialog(false)
      protocolForm.reset()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le protocole', variant: 'destructive' })
    }
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteProtocol.mutateAsync(id)
      toast({ title: 'Succès', description: 'Protocole désactivé' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de désactiver le protocole', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocoles thérapeutiques</h1>
          <p className="text-muted-foreground">Protocoles de traitement par maladie</p>
        </div>
        {can('protocols:create') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau protocole
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un protocole..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <div className="space-y-1 mt-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : protocols.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun protocole trouvé
            </CardContent>
          </Card>
        ) : (
          protocols.map((protocol) => (
            <Card key={protocol.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{protocol.name}</CardTitle>
                    {protocol.diseaseName && (
                      <p className="text-sm text-muted-foreground">
                        {protocol.diseaseCode} - {protocol.diseaseName}
                      </p>
                    )}
                  </div>
                  <Badge variant={protocol.isActive ? 'default' : 'secondary'}>
                    {protocol.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {protocol.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {protocol.description}
                  </p>
                )}
                <div className="space-y-2">
                  {protocol.steps.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {protocol.steps.length} étape(s)
                    </p>
                  )}
                  {protocol.targetPopulation && (
                    <p className="text-xs text-muted-foreground">
                      Population: {protocol.targetPopulation}
                    </p>
                  )}
                  {protocol.efficacyRate && (
                    <p className="text-xs text-muted-foreground">
                      Efficacité: {protocol.efficacyRate}%
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(protocol.createdAt)}
                  </span>
                  {can('protocols:delete') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(protocol.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} protocole(s) au total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau protocole thérapeutique</DialogTitle>
            <DialogDescription>
              Créer un nouveau protocole de traitement
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom *</label>
              <Input
                placeholder="Nom du protocole..."
                {...protocolForm.register('name')}
              />
              {protocolForm.formState.errors.name && (
                <p className="text-xs text-destructive">{protocolForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Description du protocole..."
                {...protocolForm.register('description')}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Maladie associée</label>
              <Controller
                control={protocolForm.control}
                name="diseaseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une maladie" />
                    </SelectTrigger>
                    <SelectContent>
                      {diseases.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Population cible</label>
              <Input
                placeholder="Ex: Adultes, Enfants, etc."
                {...protocolForm.register('targetPopulation')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={createProtocol.isPending}>
                {createProtocol.isPending ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
