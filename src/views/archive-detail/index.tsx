'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Archive as ArchiveIcon,
  User,
  Calendar,
  FileText,
  FolderOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { useArchiveDetail } from '@/hooks/use-data'
import { formatDateTime } from '@/lib/utils'
import type { Archive } from '@/types'

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

function renderData(data: unknown): { key: string; value: string }[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data === undefined || data === null
      ? []
      : [{ key: 'valeur', value: String(data) }]
  }
  return Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }))
}

export default function ArchiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: archive, isLoading, error } = useArchiveDetail(id)

  const a = archive as ArchiveItem | null | undefined

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de l&apos;archive...</p>
      </div>
    )
  }

  if (error || !a) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Archive non trouvée
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;archive demandée n&apos;existe pas ou a été supprimée.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/archives')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux archives
        </Button>
      </div>
    )
  }

  const type = String(a.entityType || '').toUpperCase()
  const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
  const patientName = `${a.patientFirstname ?? ''} ${a.patientLastname ?? ''}`.trim()
  const dataEntries = renderData(a.data)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/archives')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {String(a.title || 'Archive')}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge className={config.color}>
                {config.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {a.summary}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Données archivées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée archivée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {dataEntries.map((entry) => (
                        <tr key={entry.key} className="border-b last:border-0">
                          <td className="py-2 pr-4 align-top font-medium text-muted-foreground">
                            {entry.key}
                          </td>
                          <td className="py-2 align-top text-foreground break-all">
                            {entry.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {a.data && (
                <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  {JSON.stringify(a.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type d&apos;entité</p>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">ID de l&apos;entité</p>
                  <p className="text-sm font-mono text-foreground break-all">
                    {String(a.entityId || '—')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  {a.patientId ? (
                    <Link
                      href={`/patients/${a.patientId}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {patientName || 'Voir le dossier'}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <ArchiveIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Archivé par</p>
                  <p className="text-sm font-mono text-foreground">
                    {shortUuid(a.archivedBy)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d&apos;archivage</p>
                  <p className="text-sm text-foreground">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
