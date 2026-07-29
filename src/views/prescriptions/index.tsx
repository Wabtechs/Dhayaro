'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { Pill, ChevronLeft, ChevronRight } from 'lucide-react'

interface PrescriptionItem {
  id: string
  treatmentId?: string
  medicationId?: string
  medicationName?: string
  medicationGenericName?: string
  medicationForm?: string
  medicationDosage?: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  quantity?: number
  createdAt: string
}

export default function PrescriptionsView() {
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', currentPage],
    queryFn: async () => {
      const token = localStorage.getItem('dhayaro_token') || ''
      return api.get<{ items: PrescriptionItem[]; total: number }>(`/prescriptions?page=${currentPage}&size=20`, token)
    },
  })

  const items = data?.items ?? []
  const totalCount = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pill className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">{totalCount} prescription{totalCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucune prescription trouvée</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médicament</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.medicationName || '—'}
                        {item.medicationGenericName && <span className="ml-1 text-xs text-muted-foreground">({item.medicationGenericName})</span>}
                      </TableCell>
                      <TableCell>{item.dosage || '—'}</TableCell>
                      <TableCell>{item.frequency || '—'}</TableCell>
                      <TableCell>{item.duration || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.instructions || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
