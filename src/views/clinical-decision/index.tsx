'use client'

import { useState } from 'react'
import { Lightbulb, Search, AlertTriangle, TrendingUp, Pill, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useDiseasesData, useClinicalKnowledgeBaseData, useTherapeuticProtocolsData, useDiseaseStatisticsData } from '@/hooks/use-data'

interface SimilarCase {
  id: string
  ageRange?: string
  sex?: string
  symptoms: string[]
  diagnostics: string[]
  treatments: string[]
  evolution?: string
  outcome?: string
  durationDays?: number
}

interface ProtocolItem {
  id: string
  name: string
  description?: string
  steps: { order: number; description: string }[]
  targetPopulation?: string
  efficacyRate?: number
}

interface StatsItem {
  diseaseName?: string
  totalCases: number
  recoveryRate: number
  mortalityRate: number
  avgHospitalizationDays: number
  commonTreatments: { name: string; count: number }[]
  commonMedications: { name: string; count: number }[]
  commonExams: { name: string; count: number }[]
}

export default function ClinicalDecisionPage() {
  const [selectedDisease, setSelectedDisease] = useState<string>('')

  const { data: diseasesData } = useDiseasesData()
  const diseases = ((diseasesData as { items?: Array<{ id: string; name: string; code: string }> })?.items || [])

  const { data: knowledgeData, isLoading: knowledgeLoading } = useClinicalKnowledgeBaseData(
    selectedDisease ? `diseaseId=${selectedDisease}&size=20` : ''
  )
  const { data: protocolsData } = useTherapeuticProtocolsData(
    selectedDisease ? `diseaseId=${selectedDisease}` : ''
  )
  const { data: statsData } = useDiseaseStatisticsData(
    selectedDisease ? `diseaseId=${selectedDisease}` : ''
  )

  const similarCases = ((knowledgeData as { items?: SimilarCase[] })?.items || [])
  const protocols = ((protocolsData as { items?: ProtocolItem[] })?.items || [])
  const stats = ((statsData as { items?: StatsItem[] })?.items || [])[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Aide à la décision clinique
          </h1>
          <p className="text-muted-foreground">
            Recherche de cas similaires et recommandations basées sur les données
          </p>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">
              Avertissement : Cette fonctionnalité est une aide à la décision et ne remplace jamais le jugement du professionnel de santé.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-sm font-medium mb-2 block">Sélectionner une maladie</label>
          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une maladie pour voir les recommandations" />
            </SelectTrigger>
            <SelectContent>
              {diseases.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDisease && (
        <>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total cas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalCases}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taux guérison</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{stats.recoveryRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taux mortalité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{stats.mortalityRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Durée moyenne</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.avgHospitalizationDays}j</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cas similaires ({similarCases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {knowledgeLoading ? (
                  <p className="text-center py-4 text-muted-foreground">Chargement...</p>
                ) : similarCases.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Aucun cas similaire trouvé</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {similarCases.slice(0, 10).map((c, i) => (
                      <div key={i} className="p-3 rounded-lg border space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.ageRange || '?'}</Badge>
                          <Badge variant="secondary">{c.sex === 'M' ? 'H' : c.sex === 'F' ? 'F' : '?'}</Badge>
                          {c.outcome && (
                            <Badge variant={c.outcome === 'GUERISON' ? 'default' : 'secondary'}>
                              {c.outcome}
                            </Badge>
                          )}
                          {c.durationDays && (
                            <span className="text-xs text-muted-foreground">{c.durationDays}j</span>
                          )}
                        </div>
                        {c.diagnostics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {c.diagnostics.slice(0, 3).map((d, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{d}</Badge>
                            ))}
                          </div>
                        )}
                        {c.treatments.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Traitement: {c.treatments.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Protocoles recommandés ({protocols.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {protocols.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Aucun protocole disponible</p>
                  ) : (
                    <div className="space-y-3">
                      {protocols.map((p) => (
                        <div key={p.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{p.name}</p>
                            {p.efficacyRate && (
                              <Badge variant="default">{p.efficacyRate}% efficacité</Badge>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                          )}
                          {p.steps.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {p.steps.length} étape(s)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {stats && stats.commonMedications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Médicaments les plus prescrits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.commonMedications.slice(0, 5).map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">{m.name}</span>
                          <Badge variant="secondary">{m.count}x</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedDisease && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez une maladie pour voir les recommandations, cas similaires et protocoles associés.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
