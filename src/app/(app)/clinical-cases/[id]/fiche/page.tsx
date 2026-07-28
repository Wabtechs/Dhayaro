'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FicheLayout } from '@/components/fiche-layout'
import { api } from '@/services/api'

interface FicheData {
  clinicalCase: {
    id: string
    title?: string
    description?: string
    symptomsJson?: { description?: string }
    provisionalDiagnosis?: string
    treatment?: string
    treatmentDuration?: string
    outcomeStatus?: string
    outcomeNotes?: string
    priority?: string
    tagsJson?: { tags?: string[] }
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
  doctor: {
    id: string
    firstname: string
    lastname: string
    specialty?: string
    phone?: string
  } | null
  facility: {
    id: string
    name: string
    address?: string
    phone?: string
    city?: string
  } | null
}

const outcomeStatusMap: Record<string, string> = {
  PENDING: 'En attente',
  IN_TREATMENT: 'En traitement',
  RECOVERED: 'Récupéré',
  IMPROVED: 'Amélioré',
  WORSENED: 'Aggravé',
  DECEASED: 'Décédé',
}

const priorityMap: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
}

export default function ClinicalCaseFichePage() {
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
        const result = await api.get<FicheData>(`/clinical-cases/${id}/fiche`, token)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
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
        <p className="mt-2 text-sm text-muted-foreground">{error || 'Le cas clinique demandé n\'existe pas.'}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { clinicalCase, patient, doctor, facility } = data
  const symptoms = clinicalCase.symptomsJson?.description
  const tags = clinicalCase.tagsJson?.tags

  return (
    <FicheLayout
      title="FICHE DE CAS CLINIQUE"
      subtitle={clinicalCase.title || undefined}
      facility={facility}
      patient={patient}
      doctor={doctor}
      createdAt={clinicalCase.createdAt}
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {clinicalCase.priority && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Priorité</h3>
              <p className="text-sm font-medium">{priorityMap[clinicalCase.priority] || clinicalCase.priority}</p>
            </div>
          )}
          {clinicalCase.outcomeStatus && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Statut</h3>
              <p className="text-sm font-medium">{outcomeStatusMap[clinicalCase.outcomeStatus] || clinicalCase.outcomeStatus}</p>
            </div>
          )}
        </div>

        {clinicalCase.description && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Description</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{clinicalCase.description}</p>
          </div>
        )}

        {symptoms && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Symptômes</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{symptoms}</p>
          </div>
        )}

        {clinicalCase.provisionalDiagnosis && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Diagnostic provisoire</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm font-medium">{clinicalCase.provisionalDiagnosis}</p>
          </div>
        )}

        {clinicalCase.treatment && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Traitement</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{clinicalCase.treatment}</p>
            {clinicalCase.treatmentDuration && (
              <p className="mt-1 text-xs text-gray-500">Durée: {clinicalCase.treatmentDuration}</p>
            )}
          </div>
        )}

        {clinicalCase.outcomeNotes && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Notes d'évolution</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">{clinicalCase.outcomeNotes}</p>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span key={i} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </FicheLayout>
  )
}
