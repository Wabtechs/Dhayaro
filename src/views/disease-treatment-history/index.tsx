'use client'

import { useState } from 'react'
import {
  Activity,
  Pill,
  Users,
  Stethoscope,
  Syringe,
  Download,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  useDiseasesData,
  useDoctorsData,
  useDiseaseTreatmentHistoryData,
  type DiseaseTreatmentHistoryData,
} from '@/hooks/use-data'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PRESCRIBED: { label: 'Prescrit', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  IN_PROGRESS: { label: 'En cours', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  COMPLETED: { label: 'Terminé', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulé', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  SUSPENDED: { label: 'Suspendu', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

interface TimelineRow {
  treatmentId: string
  startDate: string
  createdAt: string
  description: string
  status: string
  outcome?: string
  patientName?: string
  patientDossier?: string
  doctorName?: string
  diseaseCode?: string
  diseaseName?: string
  medications: { name: string; dosage?: string; frequency?: string; duration?: string }[]
}

function downloadCsv(data: DiseaseTreatmentHistoryData) {
  const rows: TimelineRow[] = (data.timeline ?? []) as unknown as TimelineRow[]
  const header = ['Date', 'Maladie', 'Patient', 'N° Dossier', 'Médecin', 'Traitement', 'Statut', 'Issue', 'Médicaments']
  const body = rows.map((row) => [
    row.startDate,
    row.diseaseName ?? '—',
    row.patientName ?? '—',
    row.patientDossier ?? '—',
    row.doctorName ?? '—',
    row.description,
    row.status,
    row.outcome ?? '—',
    row.medications.map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', '),
  ])
  const csv = '\uFEFF' + [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'historique-traitement-maladie.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function DiseaseTreatmentHistoryPage() {
  const [diseaseId, setDiseaseId] = useState('all')
  const [doctorId, setDoctorId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [applied, setApplied] = useState('page=1&size=10')
  const [page, setPage] = useState(1)

  const buildParams = (disease: string, doctor: string, from: string, to: string, p: number) => {
    const parts = [`page=${p}`, 'size=10']
    if (disease && disease !== 'all') parts.push(`diseaseId=${disease}`)
    if (doctor && doctor !== 'all') parts.push(`doctorId=${doctor}`)
    if (from) parts.push(`dateFrom=${from}`)
    if (to) parts.push(`dateTo=${to}`)
    return parts.join('&')
  }

  const applyFilters = () => {
    setPage(1)
    setApplied(buildParams(diseaseId, doctorId, dateFrom, dateTo, 1))
  }

  const resetFilters = () => {
    setDiseaseId('all')
    setDoctorId('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setApplied('page=1&size=10')
  }

  const goToPage = (p: number) => {
    setPage(p)
    setApplied(buildParams(diseaseId, doctorId, dateFrom, dateTo, p))
  }

  const { data, isLoading } = useDiseaseTreatmentHistoryData(applied)
  const { data: diseasesData } = useDiseasesData('page=1&size=500')
  const { data: doctorsData } = useDoctorsData('page=1&size=500')

  const diseases = (diseasesData?.items ?? []) as { id: string; code?: string; name?: string }[]
  const doctors = (doctorsData?.items ?? []) as { id: string; firstname?: string; firstName?: string; lastname?: string; lastName?: string }[]

  const stats = data?.stats
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 10))
  const maxMonthCount = stats?.monthlyTrend.reduce((max, m) => Math.max(max, m.count), 0) ?? 0

  const statusEntries = stats?.statusDistribution ? Object.entries(stats.statusDistribution) : []
  const outcomeEntries = stats?.outcomeDistribution ? Object.entries(stats.outcomeDistribution).sort((a, b) => b[1] - a[1]) : []

  const selectedDisease = diseaseId !== 'all' ? diseases.find((d) => d.id === diseaseId) : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Historique de traitement des maladies</h1>
          <p className="text-sm text-muted-foreground">
            Analyse de la prise en charge des maladies : méthodes, médecins, médicaments et issues cliniques.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" disabled={!data || total === 0} onClick={() => data && downloadCsv(data)}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Maladie</p>
              <Select value={diseaseId} onValueChange={setDiseaseId}>
                <SelectTrigger><SelectValue placeholder="Toutes les maladies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les maladies</SelectItem>
                  {diseases.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code ? `${d.code} — ` : ''}{d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Médecin</p>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Tous les médecins" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les médecins</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.firstname || d.firstName} {d.lastname || d.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Du</p>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Au</p>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={applyFilters}>
              <Search className="mr-2 h-4 w-4" /> Appliquer
            </Button>
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
            {selectedDisease && (
              <Badge variant="secondary" className="ml-auto">{selectedDisease.code} — {selectedDisease.name}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Traitements', value: stats?.totalTreatments, icon: Pill },
          { label: 'Patients', value: stats?.totalPatients, icon: Users },
          { label: 'Médecins', value: stats?.totalDoctors, icon: Stethoscope },
          { label: 'Médicaments utilisés', value: stats?.totalMedications, icon: Syringe },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-12" /> : stat.value ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Répartition par statut</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : statusEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => {
                  const config = STATUS_CONFIG[status]
                  if (!config) return null
                  const pct = stats && stats.totalTreatments > 0 ? Math.round((count / stats.totalTreatments) * 100) : 0
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <Badge className={config.cls}>{config.label}</Badge>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-sm font-medium">{count}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Issues cliniques</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : outcomeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune issue renseignée.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {outcomeEntries.map(([outcome, count]) => (
                  <Badge key={outcome} variant="outline" className="px-3 py-1.5">
                    {outcome} <span className="ml-2 font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tendance mensuelle (12 derniers mois)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !stats || stats.monthlyTrend.every((m) => m.count === 0) ? (
            <p className="text-sm text-muted-foreground">Aucun traitement sur cette période.</p>
          ) : (
            <div className="flex items-end gap-2" style={{ height: 128 }}>
              {stats.monthlyTrend.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{m.count > 0 ? m.count : ''}</span>
                  <div
                    className="w-full max-w-8 rounded-t bg-primary/80"
                    style={{ height: maxMonthCount > 0 ? `${Math.max(4, (m.count / maxMonthCount) * 100)}%` : 4 }}
                  />
                  <span className="text-[10px] text-muted-foreground">{m.month.slice(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {diseaseId === 'all' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Répartition par maladie</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Maladie</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Traitements</TableHead>
                  <TableHead className="text-right">Patients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.byDisease.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Aucune donnée disponible.</TableCell>
                  </TableRow>
                ) : (
                  data.byDisease.map((row) => (
                    <TableRow
                      key={row.diseaseId ?? 'unknown'}
                      className="cursor-pointer"
                      onClick={() => {
                        setDiseaseId(row.diseaseId ?? 'all')
                        setPage(1)
                        setApplied(buildParams(row.diseaseId ?? 'all', doctorId, dateFrom, dateTo, 1))
                      }}
                    >
                      <TableCell className="font-medium">{row.diseaseName}</TableCell>
                      <TableCell><Badge variant="outline">{row.diseaseCode ?? '—'}</Badge></TableCell>
                      <TableCell className="text-right">{row.treatments}</TableCell>
                      <TableCell className="text-right">{row.patients}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Voir l'historique</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Méthodes de traitement par médecin</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médecin</TableHead>
                  <TableHead className="text-right">Traitements</TableHead>
                  <TableHead className="text-right">Patients</TableHead>
                  <TableHead>Méthodes utilisées</TableHead>
                  <TableHead>Médicaments principaux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.byDoctor.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Aucune donnée disponible.</TableCell>
                  </TableRow>
                ) : (
                  data.byDoctor.map((row) => (
                    <TableRow key={row.doctorId ?? 'unknown'}>
                      <TableCell className="font-medium">{row.doctorName}</TableCell>
                      <TableCell className="text-right">{row.treatments}</TableCell>
                      <TableCell className="text-right">{row.patients}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          {row.methods.slice(0, 3).map((m) => (
                            <p key={m.description} className="truncate text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{m.count}×</span> {m.description}
                            </p>
                          ))}
                          {row.methods.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{row.methods.length - 3} autres</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {row.medications.slice(0, 4).map((m) => (
                            <Badge key={m.name} variant="secondary" className="text-xs">
                              {m.name} ×{m.count}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historique détaillé</CardTitle>
            <p className="text-sm text-muted-foreground">{total} traitement(s)</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 hidden border-b pb-3 print:block">
            <p className="text-lg font-bold">
              Historique de traitement des maladies — {selectedDisease ? selectedDisease.name : 'Toutes les maladies'}
            </p>
            <p className="text-sm text-muted-foreground">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Maladie</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Médecin</TableHead>
                  <TableHead>Traitement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.timeline.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucun traitement trouvé pour ces critères.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.timeline.map((row) => {
                    const status = STATUS_CONFIG[row.status] ?? { label: row.status, cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
                    return (
                      <TableRow key={row.treatmentId}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(row.startDate)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{row.diseaseName ?? '—'}</p>
                          {row.diseaseCode && <p className="text-xs text-muted-foreground">{row.diseaseCode}</p>}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{row.patientName ?? '—'}</p>
                          {row.patientDossier && <p className="text-xs text-muted-foreground">{row.patientDossier}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{row.doctorName ?? '—'}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm">{row.description}</p>
                          {row.medications.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {row.medications.slice(0, 3).map((m, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {m.name}
                                  {m.dosage ? ` ${m.dosage}` : ''}
                                  {m.frequency ? ` — ${m.frequency}` : ''}
                                </Badge>
                              ))}
                              {row.medications.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{row.medications.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell><Badge className={status.cls}>{status.label}</Badge></TableCell>
                        <TableCell className="text-sm">{row.outcome ?? '—'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && total > 10 && (
            <div className="mt-4 flex items-center justify-end gap-2 print:hidden">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
