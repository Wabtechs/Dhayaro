'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { archiveSchema, toArchivePayload, ENTITY_TYPES, type ArchiveValues } from '@/lib/schemas'
import {
  Archive as ArchiveIcon,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
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
  useArchivesData,
  usePatientsData,
  useCreateArchive,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Archive, Patient } from '@/types'

const typeConfig: Record<string, { label: string; color: string }> = {
  CONSULTATION: { label: 'Consultation', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  DIAGNOSTIC: { label: 'Diagnostic', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  TREATMENT: { label: 'Traitement', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  LAB_EXAM: { label: 'Examen labo', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  DOCUMENT: { label: 'Document', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PATIENT_FILE: { label: 'Dossier patient', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
}

interface ArchiveItem extends Archive {
  patientFirstname?: string
  patientLastname?: string
  archivistFirstname?: string
  archivistLastname?: string
}

export { ArchivesView }
export default function ArchivesView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(typeFilter !== 'all' ? [`entityType=${typeFilter}`] : []),
  ].join('&')
  const { data, isLoading } = useArchivesData(searchParams)

  const items = (data?.items ?? []) as ArchiveItem[]
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const { data: patientsData } = usePatientsData()
  const createArchive = useCreateArchive()

  const patientsList = ((patientsData?.items ?? []) as Patient[])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const archiveForm = useForm<ArchiveValues>({
    resolver: zodResolver(archiveSchema),
    defaultValues: { entityType: 'CONSULTATION', entityId: '', title: '', patientId: '', summary: '', data: '' },
  })

  const handleCreate = archiveForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      await createArchive.mutateAsync(toArchivePayload(values))
      await queryClient.invalidateQueries({ queryKey: ['archives'] })
      toast({ title: 'Entité archivée', description: `"${values.title}" a été archivée.` })
      setDialogOpen(false)
      archiveForm.reset()
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'archiver cette entité.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ArchiveIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Archives</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} archive{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('archives:manage') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Archiver une entité
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Archiver une entité</DialogTitle>
              <DialogDescription>
                Enregistrez une copie immuable d&apos;une entité dans les archives.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d&apos;entité *</label>
                <Controller
                  control={archiveForm.control}
                  name="entityType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {typeConfig[t]?.label || t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {archiveForm.formState.errors.entityType && (
                  <p className="text-xs text-destructive">{archiveForm.formState.errors.entityType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID de l&apos;entité *</label>
                <Input
                  placeholder="UUID de l'entité"
                  {...archiveForm.register('entityId')}
                />
                {archiveForm.formState.errors.entityId && (
                  <p className="text-xs text-destructive">{archiveForm.formState.errors.entityId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  placeholder="Titre de l'archive"
                  {...archiveForm.register('title')}
                />
                {archiveForm.formState.errors.title && (
                  <p className="text-xs text-destructive">{archiveForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient</label>
                <Controller
                  control={archiveForm.control}
                  name="patientId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un patient (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {patientsList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Résumé</label>
                <Textarea
                  placeholder="Résumé de l'archive"
                  rows={3}
                  {...archiveForm.register('summary')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Données (JSON)</label>
                <Textarea
                  placeholder='{ "cle": "valeur" }'
                  rows={4}
                  {...archiveForm.register('data')}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                >
                  {creating ? 'Archivage...' : 'Archiver'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une archive..."
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
              <Select value={typeFilter} onValueChange={(v) => {
                setTypeFilter(v)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeConfig[t]?.label || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune archive disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Archivé par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: ArchiveItem) => {
                    const type = String(item.entityType || '').toUpperCase()
                    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstname ?? ''} ${item.patientLastname ?? ''}`.trim()
                    const archivistName = `${item.archivistFirstname ?? ''} ${item.archivistLastname ?? ''}`.trim()
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/archives/${item.id}`)}
                      >
                        <TableCell>
                          <Badge className={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {String(item.title || '—')}
                        </TableCell>
                        <TableCell>
                          {patientName || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {archivistName || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/archives/${item.id}`)}
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
    </div>
  )
}
