'use client'

import { useState } from 'react'
import {
  Search, ChevronLeft, ChevronRight, Eye, CreditCard, ReceiptText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useInvoicesData, useBillingCodesData, usePaymentsData, useCreatePayment } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface InvoiceItem {
  id: string; patientId?: string; invoiceNumber?: string; status?: string
  totalAmount?: number; paidAmount?: number; currency?: string
  issueDate?: string; paidAt?: string; notes?: string
  patientFirstname?: string; patientLastname?: string
  doctorFirstname?: string; doctorLastname?: string
  createdAt?: string; updatedAt?: string
  [key: string]: unknown
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  ISSUED: { label: 'Émise', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  PAID: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  REFUNDED: { label: 'Remboursée', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
}

export { BillerView }
export default function BillerView() {
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const params = [
    `page=${currentPage}`,
    'size=10',
    ...(search ? [`search=${search}`] : []),
    ...(statusFilter !== 'all' ? [`status=${statusFilter}`] : []),
  ].join('&')

  const { data: invoicesData, isLoading } = useInvoicesData(params)
  const { data: billingCodesData } = useBillingCodesData()
  const { data: paymentsData } = usePaymentsData()
  const createPayment = useCreatePayment()

  const items: InvoiceItem[] = ((invoicesData as Record<string, unknown>)?.items ?? []) as InvoiceItem[]
  const totalCount = ((invoicesData as Record<string, unknown>)?.total ?? 0) as number
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))
  const billingCodes: { id: string; code: string; label: string; price: number; serviceType: string }[] =
    ((billingCodesData as Record<string, unknown>)?.items ?? []) as { id: string; code: string; label: string; price: number; serviceType: string }[]
  const payments = ((paymentsData as Record<string, unknown>)?.items ?? []) as Record<string, unknown>[]

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [reference, setReference] = useState('')
  const [paying, setPaying] = useState(false)

  const openDetail = (item: InvoiceItem) => {
    setSelectedInvoice(item)
    setDetailOpen(true)
  }

  const openPayment = (item: InvoiceItem) => {
    setSelectedInvoice(item)
    setAmount(item.totalAmount ? String(item.totalAmount - (item.paidAmount || 0)) : '')
    setMethod('CASH')
    setReference('')
    setPaymentOpen(true)
  }

  const handlePay = async () => {
    if (!selectedInvoice || !can('billing:pay')) {
      toast({ title: 'Non autorisé', description: "Vous n'avez pas les droits pour enregistrer un paiement.", variant: 'destructive' })
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast({ title: 'Montant invalide', description: 'Veuillez saisir un montant supérieur à zéro.', variant: 'destructive' })
      return
    }
    setPaying(true)
    try {
      await createPayment.mutateAsync({
        invoiceId: selectedInvoice.id,
        patientId: selectedInvoice.patientId,
        amount: Number(amount),
        method,
        reference: reference || null,
        status: 'COMPLETED',
      })
      toast({ title: 'Succès', description: 'Paiement enregistré avec succès.' })
      setPaymentOpen(false)
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer le paiement.", variant: 'destructive' })
    } finally {
      setPaying(false)
    }
  }

  const totalBilled = items.reduce((s, i) => s + (i.totalAmount || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (i.paidAmount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" /> Facturation
          </h1>
          <p className="text-sm text-muted-foreground">
            {payments.length} paiement(s) enregistré(s) · {items.filter((i) => i.status !== 'PAID').length} facture(s) impayée(s)
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="font-medium">Total facturé :</span>
          <span>{totalBilled.toLocaleString()} FC</span>
          <span className="font-medium">Total payé :</span>
          <span className="text-emerald-600">{totalPaid.toLocaleString()} FC</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Totaux du tableau</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{(totalBilled - totalPaid).toLocaleString()} FC</div>
          <p className="text-xs text-muted-foreground">Restant à payer</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture ou patient..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ISSUED">À payer</SelectItem>
            <SelectItem value="PAID">Payées</SelectItem>
            <SelectItem value="CANCELLED">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° facture</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Émise le</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                    Aucune facture
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const sc = statusConfig[item.status || ''] || statusConfig.DRAFT
                  const outstanding = (item.totalAmount || 0) - (item.paidAmount || 0)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.invoiceNumber || '—'}</TableCell>
                      <TableCell>{item.patientFirstname || ''} {item.patientLastname || ''}</TableCell>
                      <TableCell>{item.doctorFirstname || ''} {item.doctorLastname || ''}</TableCell>
                      <TableCell className="text-right">
                        {(item.totalAmount || 0).toLocaleString()} FC
                        {outstanding > 0 && <span className="text-muted-foreground block text-xs">{outstanding.toLocaleString()} FC restant</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.color}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell>{item.issueDate ? formatDate(item.issueDate) : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openDetail(item)}>
                          <Eye className="h-4 w-4 mr-1" /> Détail
                        </Button>
                        {outstanding > 0 && can('billing:pay') && (
                          <Button size="sm" variant="outline" className="ml-1" onClick={() => openPayment(item)}>
                            <CreditCard className="h-4 w-4 mr-1" /> Payer
                          </Button>
                        )}
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" /> Facture {selectedInvoice?.invoiceNumber || ''}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice?.patientFirstname || ''} {selectedInvoice?.patientLastname || ''} · {selectedInvoice?.issueDate ? formatDate(selectedInvoice.issueDate) : '—'}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <p className="text-sm">{(statusConfig[selectedInvoice.status || '']?.label) || selectedInvoice.status || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Médecin</p>
                  <p className="text-sm">{selectedInvoice.doctorFirstname || ''} {selectedInvoice.doctorLastname || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Montant total</p>
                  <p className="text-sm font-bold">{(selectedInvoice.totalAmount || 0).toLocaleString()} FC</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Montant payé</p>
                  <p className="text-sm">{(selectedInvoice.paidAmount || 0).toLocaleString()} FC</p>
                </div>
                {(selectedInvoice.paidAt) && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Payée le</p>
                    <p className="text-sm">{formatDateTime(new Date(selectedInvoice.paidAt))}</p>
                  </div>
                )}
                {selectedInvoice.notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Articles de prestation</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Code</TableHead><TableHead>Désignation</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Montant</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingCodes.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Aucun article</TableCell></TableRow>
                      ) : (
                        billingCodes.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.code}</TableCell>
                            <TableCell>{c.label}</TableCell>
                            <TableCell>{c.serviceType}</TableCell>
                            <TableCell className="text-right">{c.price.toLocaleString()} FC</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
            {(selectedInvoice && (selectedInvoice.totalAmount || 0) - (selectedInvoice.paidAmount || 0) > 0) && can('billing:pay') && (
              <Button onClick={() => { setDetailOpen(false); openPayment(selectedInvoice) }}>
                <CreditCard className="h-4 w-4 mr-2" /> Enregistrer un paiement
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Facture {selectedInvoice?.invoiceNumber || ''} — {(selectedInvoice ? (selectedInvoice.totalAmount || 0) - (selectedInvoice.paidAmount || 0) : 0).toLocaleString()} FC restant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FC)</Label>
              <Input id="amount" type="number" placeholder="ex. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Moyen de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="CARD">Carte bancaire</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                  <SelectItem value="INSURANCE">Assurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence (optionnel)</Label>
              <Input id="reference" placeholder="ex. reçu #12345" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={paying}>Annuler</Button>
            <Button onClick={handlePay} disabled={paying}>
              {paying ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} sur {totalPages} ({totalCount} factures)
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || isLoading}
        >
          Suivant<ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
