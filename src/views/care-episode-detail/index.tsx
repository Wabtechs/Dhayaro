'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Archive, Clock, User, FileText, Brain, Pill, TestTube, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCareEpisodeDetail, useArchiveCareEpisode } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, string> = {
  ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  TRIAGE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONSULTATION: 'bg-purple-100 text-purple-800 border-purple-200',
  TREATMENT: 'bg-orange-100 text-orange-800 border-orange-200',
  HOSPITALIZED: 'bg-red-100 text-red-800 border-red-200',
  DISCHARGED: 'bg-green-100 text-green-800 border-green-200',
  TRANSFERRED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<string, string> = {
  ADMITTED: 'Admis',
  TRIAGE: 'Triage',
  CONSULTATION: 'Consultation',
  TREATMENT: 'Traitement',
  HOSPITALIZED: 'Hospitalisé',
  DISCHARGED: 'Sorti',
  TRANSFERRED: 'Transféré',
  ARCHIVED: 'Archivé',
}

interface EpisodeDetail {
  id: string
  episodeNumber: string
  status: string
  admitDate: string
  dischargeDate?: string
  admitReason?: string
  dischargeSummary: Record<string, unknown>
  dischargeOutcome?: string
  isArchived: boolean
  metadata: Record<string, unknown>
  patientFirstname?: string
  patientLastname?: string
  patientSex?: string
  patientDateOfBirth?: string
  entities?: Record<string, Array<Record<string, unknown>>>
}

export default function CareEpisodeDetailPage({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const { data, isLoading } = useCareEpisodeDetail(id)
  const archiveEpisode = useArchiveCareEpisode()

  const episode = data as EpisodeDetail | undefined

  const handleArchive = async () => {
    if (!episode) return
    try {
      await archiveEpisode.mutateAsync(episode.id)
      toast({ title: 'Succès', description: 'Épisode archivé avec succès' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'archiver l\'épisode', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Épisode non trouvé</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const entities = episode.entities || {}
  const consultations = entities.consultations || []
  const diagnostics = entities.diagnostics || []
  const treatments = entities.treatments || []
  const labExams = entities.labExams || []
  const documents = entities.documents || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {episode.episodeNumber}
            </h1>
            <p className="text-muted-foreground">
              {episode.patientFirstname} {episode.patientLastname}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColors[episode.status] || ''}>
            {statusLabels[episode.status] || episode.status}
          </Badge>
          {can('episodes:archive') && !episode.isArchived && (
            <Button variant="outline" onClick={handleArchive} disabled={archiveEpisode.isPending}>
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(episode.admitDate)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{episode.patientFirstname} {episode.patientLastname}</span>
            </div>
            {episode.patientSex && (
              <p className="text-xs text-muted-foreground mt-1">
                {episode.patientSex === 'M' ? 'Masculin' : episode.patientSex === 'F' ? 'Féminin' : 'Autre'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Motif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{episode.admitReason || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sortie</CardTitle>
          </CardHeader>
          <CardContent>
            {episode.dischargeDate ? (
              <div>
                <span className="text-sm">{formatDate(episode.dischargeDate)}</span>
                {episode.dischargeOutcome && (
                  <Badge variant="outline" className="mt-1 text-xs">{episode.dischargeOutcome}</Badge>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">En cours</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs defaultValue="consultations">
        <TabsList>
          <TabsTrigger value="consultations" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Consultations ({consultations.length})
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Diagnostics ({diagnostics.length})
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Traitements ({treatments.length})
          </TabsTrigger>
          <TabsTrigger value="lab" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Laboratoire ({labExams.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultations">
          <Card>
            <CardContent className="p-4">
              {consultations.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucune consultation liée</p>
              ) : (
                <div className="space-y-3">
                  {consultations.map((c: Record<string, unknown>) => (
                    <div key={c.id as string} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{c.consultationNumber as string}</p>
                        <p className="text-sm text-muted-foreground">{c.motif as string}</p>
                      </div>
                      <Badge variant="outline">{c.status as string}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardContent className="p-4">
              {diagnostics.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucun diagnostic lié</p>
              ) : (
                <div className="space-y-3">
                  {diagnostics.map((d: Record<string, unknown>) => (
                    <div key={d.id as string} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{d.description as string}</p>
                        <p className="text-sm text-muted-foreground">{d.diagnosticType as string}</p>
                      </div>
                      <Badge variant="outline">{d.isValidated ? 'Validé' : 'En attente'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <CardContent className="p-4">
              {treatments.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucun traitement lié</p>
              ) : (
                <div className="space-y-3">
                  {treatments.map((t: Record<string, unknown>) => (
                    <div key={t.id as string} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{t.description as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.startDate as string} {t.endDate ? `→ ${t.endDate}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline">{t.status as string}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab">
          <Card>
            <CardContent className="p-4">
              {labExams.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucun examen lié</p>
              ) : (
                <div className="space-y-3">
                  {labExams.map((l: Record<string, unknown>) => (
                    <div key={l.id as string} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{l.examName as string}</p>
                        <p className="text-sm text-muted-foreground">{l.clinicalIndication as string || '—'}</p>
                      </div>
                      <Badge variant="outline">{l.status as string}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-4">
              {documents.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">Aucun document lié</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: Record<string, unknown>) => (
                    <div key={doc.id as string} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.title as string}</p>
                          <p className="text-sm text-muted-foreground">{doc.documentType as string}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {episode.dischargeSummary && Object.keys(episode.dischargeSummary).length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Résumé de sortie</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(episode.dischargeSummary, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
