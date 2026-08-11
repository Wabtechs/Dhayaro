'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FicheLayout } from '@/components/fiche-layout'
import { api } from '@/services/api'
import { formatDate } from '@/lib/utils'

interface FicheData {
  episode: {
    id: string
    episodeNumber: string
    status: string
    admitDate: string
    dischargeDate?: string
    admitReason?: string
    dischargeSummary?: Record<string, unknown>
    dischargeOutcome?: string
    metadata?: Record<string, unknown>
    createdAt: string
  }
  patient: {
    id: string
    firstname: string
    lastname: string
    dateOfBirth?: string
    sex?: string
    phone?: string
    address?: string
    city?: string
    bloodGroup?: string
    allergies?: string[]
  } | null
  facility: {
    id: string
    name: string
    address?: string
    phone?: string
    city?: string
  } | null
  consultations: Array<{
    id: string
    consultationNumber: string
    motif: string
    notes?: string
    status: string
    createdAt: string
    doctorFirstname?: string
    doctorLastname?: string
  }>
  diagnostics: Array<{
    id: string
    diagnosticType: string
    description: string
    notes?: string
    createdAt: string
  }>
  exams: Array<{
    id: string
    examName: string
    status: string
    results?: Record<string, unknown>
    resultNotes?: string
    createdAt: string
  }>
  treatments: Array<{
    id: string
    description: string
    status: string
    startDate: string
    endDate?: string
    notes?: string
    outcome?: string
    createdAt: string
  }>
  prescriptions: Array<{
    id: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
    quantity?: number
    medicationName?: string
  }>
}

const statusMap: Record<string, string> = {
  ADMITTED: 'Admis',
  TRIAGE: 'Triage',
  CONSULTATION: 'Consultation',
  TREATMENT: 'Traitement',
  HOSPITALIZED: 'Hospitalisé',
  DISCHARGED: 'Sorti',
  TRANSFERRED: 'Transféré',
  ARCHIVED: 'Archivé',
}

const outcomeMap: Record<string, string> = {
  RECOVERED: 'Récupéré',
  IMPROVED: 'Amélioré',
  STABLE: 'Stable',
  WORSENED: 'Aggravé',
  DECEASED: 'Décédé',
  TRANSFERRED: 'Transféré',
}

export default function CareEpisodeFichePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<FicheData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFiche = async () => {
      try {
        const token = localStorage.getItem('dhayaro_token')
        if (!token) {
          router.push('/login')
          return
        }
        const result = await api.get<FicheData>(`/care-episodes/${id}/fiche`, token)
        setData(result)
      } catch (err) {
        setError('Impossible de charger les données de l\'épisode. Veuillez réessayer.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchFiche()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de la fiche...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Fiche non trouvée</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'L\'épisode de soins demandé n\'existe pas.'}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { episode, patient, facility, consultations, diagnostics, exams, treatments, prescriptions } = data

  return (
    <FicheLayout
      title="FICHE D'ÉPISODE DE SOINS"
      subtitle={episode.episodeNumber}
      facility={facility}
      patient={patient}
      doctor={null}
      createdAt={episode.createdAt}
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Statut</h3>
            <p className="text-sm font-medium">{statusMap[episode.status] || episode.status}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Date d'admission</h3>
            <p className="text-sm font-medium">{formatDate(episode.admitDate)}</p>
          </div>
          {episode.dischargeDate && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Date de sortie</h3>
              <p className="text-sm font-medium">{formatDate(episode.dischargeDate)}</p>
            </div>
          )}
          {episode.dischargeOutcome && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Issue de sortie</h3>
              <p className="text-sm font-medium">{outcomeMap[episode.dischargeOutcome] || episode.dischargeOutcome}</p>
            </div>
          )}
        </div>

        {episode.admitReason && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Motif d'admission</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{episode.admitReason}</p>
          </div>
        )}

        {consultations.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Consultations ({consultations.length})</h3>
            <div className="space-y-2">
              {consultations.map(c => (
                <div key={c.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{c.consultationNumber}</p>
                    <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{c.motif}</p>
                  {c.doctorFirstname && (
                    <p className="mt-1 text-xs text-gray-500">Dr. {c.doctorFirstname} {c.doctorLastname}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {diagnostics.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Diagnostics ({diagnostics.length})</h3>
            <div className="space-y-2">
              {diagnostics.map(d => (
                <div key={d.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{d.diagnosticType}</p>
                    <span className="text-xs text-gray-500">{formatDate(d.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {exams.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Examens ({exams.length})</h3>
            <div className="space-y-2">
              {exams.map(e => (
                <div key={e.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{e.examName}</p>
                    <span className="text-xs text-gray-500">{formatDate(e.createdAt)}</span>
                  </div>
                  {e.resultNotes && <p className="mt-1 text-sm text-gray-600">{e.resultNotes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {treatments.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Traitements ({treatments.length})</h3>
            <div className="space-y-2">
              {treatments.map(t => (
                <div key={t.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium">{t.description}</p>
                  {t.notes && <p className="mt-1 text-sm text-gray-600">{t.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {prescriptions.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Prescriptions ({prescriptions.length})</h3>
            <div className="space-y-2">
              {prescriptions.map(p => (
                <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium">{p.medicationName || 'Médicament inconnu'}</p>
                  <p className="text-sm text-gray-600">{p.dosage} — {p.frequency} — {p.duration}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {episode.dischargeSummary && Object.keys(episode.dischargeSummary).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Résumé de sortie</h3>
            <div className="rounded-lg border border-gray-200 p-3">
              {Object.entries(episode.dischargeSummary).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                  <span className="text-sm text-gray-600">{key}</span>
                  <span className="text-sm font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FicheLayout>
  )
}
