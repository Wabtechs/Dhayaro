'use client'

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Pill, Search, ChevronLeft, ChevronRight, CheckCircle, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useTreatmentsListData, useQueueData, useDispenseTreatment } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

const statusConfig: Record<string, { label: string; color: string }> = {
  PRESCRIBED: { label: 'Prescrit', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  COMPLETED: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  SUSPENDED: { label: 'Suspendu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
}

interface TreatmentItem {
  id: string; patientId?: string; doctorId?: string; description?: string
  status?: string; startDate?: string; endDate?: string; notes?: string
  patientFirstname?: string; patientLastname?: string
  doctorFirstname?: string; doctorLastname?: string
  createdAt?: string; updatedAt?: string
  [key: string]: unknown
}

export { PharmacyView }
export default function PharmacyView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('PRESCRIBED')
  const [currentPage, setCurrentPage] = useState(1)

  const filterParam = statusFilter !== 'all' ? `status=${statusFilter}` : ''
  const { data: treatmentsData, isLoading } = useTreatmentsListData(filterParam)
  const { data: queueData } = useQueueData()

  const dispenseTreatment = useDispenseTreatment()

  const queueEntries = ((queueData as Record<string, unknown>)?.items ?? []) as Record<string, unknown>[]

  const getQueueIdForPatient = (patientId: string): string | undefined => {
    const entry = queueEntries.find((q) => q.patientId === patientId && (q.status === 'WITH_PHARMACY' || q.status === 'WAITING'))
    return entry?.id as string | undefined
  }

  const filtered = useMemo(() => {
    const allItems = ((treatmentsData as Record<string, unknown>)?.items ?? []) as TreatmentItem[]
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (!q) return true
      const patient = `${item.patientFirstname || ''} ${item.patientLastname || ''}`.trim().toLowerCase()
      const desc = String(item.description || '').toLowerCase()
      return patient.includes(q) || desc.includes(q)
    })
  }, [treatmentsData, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TreatmentItem | null>(null)
  const [dispensing, setDispensing] = useState(false)

  const openDetail = (item: TreatmentItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  const handleDispense = async () => {
    if (!selectedItem) return
    setDispensing(true)
    try {
      const queueId = getQueueIdForPatient(selectedItem.patientId!)
      await dispenseTreatment.mutateAsync({
        id: selectedItem.id,
        queueId,
      })
      toast({ title: 'Succès', description: 'Traitement délivré avec succès.' })
      setDetailOpen(false)
      setSelectedItem(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de délivrer le traitement.', variant: 'destructive' })
    } finally {
      setDispensing(false)
    }
  }

  const pendingCount = ((treatmentsData as Record<string, unknown>)?.items as TreatmentItem[] | undefined)?.filter(
    (t) => t.status === 'PRESCRIBED'
  )?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pharmacie</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount} prescription(s) en attente de délivrance
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un patient ou traitement..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRESCRIBED">Prescrit</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Traitement</TableHead>
                <TableHead>Prescrit le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune prescription à délivrer
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => {
                  const sc = statusConfig[item.status || ''] || statusConfig.PRESCRIBED
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.patientFirstname || ''} {item.patientLastname || ''}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.createdAt ? formatDate(item.createdAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.color}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openDetail(item)}>
                          <Eye className="h-4 w-4 mr-1" /> Détail
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
          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Détail de la prescription
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.patientFirstname || ''} {selectedItem?.patientLastname || ''}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Traitement</p>
                <p className="text-sm">{selectedItem.description || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prescrit le</p>
                  <p className="text-sm">{selectedItem.createdAt ? formatDate(selectedItem.createdAt) : '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge className={statusConfig[selectedItem.status || '']?.color || ''}>
                    {statusConfig[selectedItem.status || '']?.label || selectedItem.status}
                  </Badge>
                </div>
              </div>
              {selectedItem.startDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Début du traitement</p>
                  <p className="text-sm">{formatDate(selectedItem.startDate)}</p>
                </div>
              )}
              {selectedItem.endDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fin du traitement</p>
                  <p className="text-sm">{formatDate(selectedItem.endDate)}</p>
                </div>
              )}
              {selectedItem.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
            {selectedItem?.status === 'PRESCRIBED' && (
              <Button onClick={handleDispense} disabled={dispensing || !can('pharmacy:dispense')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {dispensing ? 'Délivrance...' : 'Délivrer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
