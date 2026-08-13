'use client'

import { useRouter } from 'next/navigation'
import {
  Users,
  Stethoscope,
  TestTube,
  Pill,
  ArrowLeft,
  Download,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  usePatientsData,
  useConsultationsData,
  useLabExamsData,
  useTreatmentsData,
} from '@/hooks/use-data'
import { formatDate } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render: (row: T) => string
}

interface ReportConfig<T> {
  title: string
  description: string
  icon: typeof Users
  columns: Column<T>[]
}

type ReportRow = Record<string, unknown>

const reportConfigs: Record<string, ReportConfig<ReportRow>> = {
  patients: {
    title: 'Rapport Patients',
    description: 'Liste et répartition de la patientèle',
    icon: Users,
    columns: [
      { key: 'name', label: 'Patient', render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—' },
      { key: 'sex', label: 'Sexe', render: (r) => String(r.sex || '—') },
      { key: 'dateOfBirth', label: 'Naissance', render: (r) => (r.dateOfBirth ? formatDate(String(r.dateOfBirth)) : '—') },
      { key: 'phone', label: 'Téléphone', render: (r) => String(r.phone || '—') },
      { key: 'medicalRecordNumber', label: 'N° Dossier', render: (r) => String(r.medicalRecordNumber || '—') },
      { key: 'createdAt', label: 'Enregistré le', render: (r) => (r.createdAt ? formatDate(String(r.createdAt)) : '—') },
    ],
  },
  consultations: {
    title: 'Rapport Consultations',
    description: 'Consultations réalisées et motifs',
    icon: Stethoscope,
    columns: [
      { key: 'consultationNumber', label: 'N° Consultation', render: (r) => String(r.consultationNumber || '—') },
      { key: 'name', label: 'Patient', render: (r) => `${r.patientFirstname || ''} ${r.patientLastname || ''}`.trim() || '—' },
      { key: 'motif', label: 'Motif', render: (r) => String(r.motif || '—') },
      { key: 'doctor', label: 'Médecin', render: (r) => `${r.doctorFirstname || ''} ${r.doctorLastname || ''}`.trim() || '—' },
      { key: 'status', label: 'Statut', render: (r) => String(r.status || '—') },
      { key: 'createdAt', label: 'Date', render: (r) => (r.createdAt ? formatDate(String(r.createdAt)) : '—') },
    ],
  },
  laboratory: {
    title: 'Rapport Laboratoire',
    description: 'Examens demandés et résultats rendus',
    icon: TestTube,
    columns: [
      { key: 'examName', label: 'Examen', render: (r) => String(r.examName || '—') },
      { key: 'category', label: 'Catégorie', render: (r) => String(r.categoryName || '—') },
      { key: 'name', label: 'Patient', render: (r) => `${r.patientFirstname || ''} ${r.patientLastname || ''}`.trim() || '—' },
      { key: 'status', label: 'Statut', render: (r) => String(r.status || '—') },
      { key: 'result', label: 'Résultat', render: (r) => String(r.result || '—') },
      { key: 'createdAt', label: 'Date', render: (r) => (r.createdAt ? formatDate(String(r.createdAt)) : '—') },
    ],
  },
  treatments: {
    title: 'Rapport Traitements',
    description: 'Traitements prescrits et issues cliniques',
    icon: Pill,
    columns: [
      { key: 'description', label: 'Traitement', render: (r) => String(r.description || '—') },
      { key: 'name', label: 'Patient', render: (r) => `${r.patientFirstname || ''} ${r.patientLastname || ''}`.trim() || '—' },
      { key: 'doctor', label: 'Médecin', render: (r) => `${r.doctorFirstname || ''} ${r.doctorLastname || ''}`.trim() || '—' },
      { key: 'status', label: 'Statut', render: (r) => String(r.status || '—') },
      { key: 'outcome', label: 'Issue', render: (r) => String(r.outcome || '—') },
      { key: 'createdAt', label: 'Date', render: (r) => (r.createdAt ? formatDate(String(r.createdAt)) : '—') },
    ],
  },
}

function downloadCsv<T>(filename: string, columns: Column<T>[], rows: T[]) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(';')
  const body = rows.map((row) =>
    columns.map((c) => `"${c.render(row).replace(/"/g, '""')}"`).join(';')
  )
  const csv = '\uFEFF' + [header, ...body].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function ReportTable<T>({ config, rows, isLoading, filename, total }: {
  config: ReportConfig<T>
  rows: T[]
  isLoading: boolean
  filename: string
  total: number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <p className="text-sm font-medium text-muted-foreground">{total} enregistrement(s)</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || rows.length === 0}
              onClick={() => downloadCsv(filename, config.columns, rows)}
            >
              <Download className="mr-2 h-4 w-4" /> Exporter CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        </div>

        <div className="mb-4 hidden border-b pb-3 print:block">
          <p className="text-lg font-bold">{config.title}</p>
          <p className="text-sm text-muted-foreground">
            Généré le {new Date().toLocaleDateString('fr-FR')} — {total} enregistrement(s)
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {config.columns.map((col) => (
                      <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={config.columns.length} className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {config.columns.map((col) => (
                      <TableCell key={col.key} className="text-sm">{col.render(row)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function PatientsReport() {
  const { data, isLoading } = usePatientsData(undefined, '?page=1&size=500')
  const items = (data?.items ?? []) as ReportRow[]
  const config = reportConfigs.patients
  return <ReportTable config={config} rows={items} isLoading={isLoading} total={data?.total ?? 0} filename="rapport-patients.csv" />
}

function ConsultationsReport() {
  const { data, isLoading } = useConsultationsData('?page=1&size=500')
  const items = (data?.items ?? []) as ReportRow[]
  const config = reportConfigs.consultations
  return <ReportTable config={config} rows={items} isLoading={isLoading} total={data?.total ?? 0} filename="rapport-consultations.csv" />
}

function LaboratoryReport() {
  const { data, isLoading } = useLabExamsData('?page=1&size=500')
  const items = (data?.items ?? []) as ReportRow[]
  const config = reportConfigs.laboratory
  return <ReportTable config={config} rows={items} isLoading={isLoading} total={data?.total ?? 0} filename="rapport-laboratoire.csv" />
}

function TreatmentsReport() {
  const { data, isLoading } = useTreatmentsData()
  const items = ((data as { items?: ReportRow[] })?.items ?? []) as ReportRow[]
  const config = reportConfigs.treatments
  return <ReportTable config={config} rows={items} isLoading={isLoading} total={(data as { total?: number })?.total ?? 0} filename="rapport-traitements.csv" />
}

export default function ReportDetailView({ type }: { type: string }) {
  const router = useRouter()
  const config = reportConfigs[type]

  if (!config) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/reports')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux rapports
        </Button>
        <div className="text-center py-10 text-muted-foreground">
          Type de rapport inconnu : {type}
        </div>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="outline" size="icon" onClick={() => router.push('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Icon className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {type === 'patients' && <PatientsReport />}
      {type === 'consultations' && <ConsultationsReport />}
      {type === 'laboratory' && <LaboratoryReport />}
      {type === 'treatments' && <TreatmentsReport />}
    </div>
  )
}

export { ReportDetailView }
