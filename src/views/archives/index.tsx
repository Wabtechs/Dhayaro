'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
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
import { sanitizeUuid } from '@/lib/validation'
import type { Archive, Patient } from '@/types'

const ITEMS_PER_PAGE = 10

const ENTITY_TYPES = [
  'CONSULTATION',
  'DIAGNOSTIC',
  'TREATMENT',
  'LAB_EXAM',
  'DOCUMENT',
  'PATIENT_FILE',
] as const

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
}

function shortUuid(value?: string): string {
  if (!value) return '—'
  return value.slice(0, 8)
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

  const { data, isLoading } = useArchivesData(
    typeFilter !== 'all' ? `entityType=${typeFilter}` : ''
  )

  const { data: patientsData } = usePatientsData()
  const createArchive = useCreateArchive()

  const patientsList = ((patientsData?.items ?? []) as Patient[])

  const filtered = useMemo(() => {
    const allItems = (data?.items ?? []) as ArchiveItem[]
    if (!search) return allItems
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      const patientName = `${item.patientFirstname ?? ''} ${item.patientLastname ?? ''}`.trim().toLowerCase()
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        patientName.includes(q)
      )
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newArchive, setNewArchive] = useState({
    entityType: 'CONSULTATION' as string,
    entityId: '',
    title: '',
    patientId: '',
    summary: '',
    data: '',
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      const parsedData: Record<string, unknown> = newArchive.data.trim()
        ? safeParseJson(newArchive.data)
        : {}
      await createArchive.mutateAsync({
        entityType: newArchive.entityType,
        entityId: sanitizeUuid(newArchive.entityId) as string,
        title: newArchive.title,
        patientId: sanitizeUuid(newArchive.patientId) || null,
        summary: newArchive.summary || null,
        data: parsedData,
      })
      await queryClient.invalidateQueries({ queryKey: ['archives'] })
      toast({ title: 'Entité archivée', description: `"${newArchive.title}" a été archivée.` })
      setDialogOpen(false)
      setNewArchive({ entityType: 'CONSULTATION', entityId: '', title: '', patientId: '', summary: '', data: '' })
      setCurrentPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'archiver cette entité.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ArchiveIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Archives</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} archive{filtered.length > 1 ? 's' : ''}
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
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d&apos;entité *</label>
                <Select value={newArchive.entityType} onValueChange={(v) => setNewArchive({ ...newArchive, entityType: v })}>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID de l&apos;entité *</label>
                <Input
                  placeholder="UUID de l'entité"
                  value={newArchive.entityId}
                  onChange={(e) => setNewArchive({ ...newArchive, entityId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre *</label>
                <Input
                  placeholder="Titre de l'archive"
                  value={newArchive.title}
                  onChange={(e) => setNewArchive({ ...newArchive, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Patient</label>
                <Select value={newArchive.patientId} onValueChange={(v) => setNewArchive({ ...newArchive, patientId: v })}>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Résumé</label>
                <Textarea
                  placeholder="Résumé de l'archive"
                  rows={3}
                  value={newArchive.summary}
                  onChange={(e) => setNewArchive({ ...newArchive, summary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Données (JSON)</label>
                <Textarea
                  placeholder='{ "cle": "valeur" }'
                  rows={4}
                  value={newArchive.data}
                  onChange={(e) => setNewArchive({ ...newArchive, data: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={creating || !newArchive.title || !newArchive.entityId}
                onClick={handleCreate}
              >
                {creating ? 'Archivage...' : 'Archiver'}
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
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : paginated.length === 0 ? (
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
                  {paginated.map((item: ArchiveItem) => {
                    const type = String(item.entityType || '').toUpperCase()
                    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
                    const patientName = `${item.patientFirstname ?? ''} ${item.patientLastname ?? ''}`.trim()
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
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {shortUuid(item.archivedBy)}
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

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return { text: value }
  }
}
