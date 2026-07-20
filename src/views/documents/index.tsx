'use client'

import { useState, useMemo } from 'react'
import { FileText, Search } from 'lucide-react'
import { useDocumentsData } from '@/hooks/use-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  PRESCRIPTION: 'Ordonnance',
  REPORT: 'Rapport',
  CERTIFICATE: 'Certificat',
  LAB_RESULT: 'Résultat labo',
  IMAGING: 'Imagerie',
  SUMMARY: 'Compte-rendu',
  REFERRAL: 'Demande d\'avis',
  CONSENT: 'Consentement',
}

export { DocumentsView }
export default function DocumentsView() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDocumentsData(search ? `search=${search}` : '')
  const filtered = useMemo(() => {
    const items = data?.items ?? []
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item: Record<string, unknown>) =>
        String(item.type || '').toLowerCase().includes(q) ||
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.doctor || '').toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} document{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun document disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Imprimé</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: Record<string, unknown>) => (
                    <TableRow key={item.id as string}>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[String(item.type || '').toUpperCase()] || String(item.type || '—')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(item.title || '—')}
                      </TableCell>
                      <TableCell>
                        {String(item.patient || item.patientName || '—')}
                      </TableCell>
                      <TableCell>{String(item.doctor || item.doctorName || '—')}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.printed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {item.printed ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt as string)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
