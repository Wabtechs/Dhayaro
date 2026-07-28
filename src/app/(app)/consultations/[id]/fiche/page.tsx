'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FicheLayout } from '@/components/fiche-layout'
import { api } from '@/services/api'

interface FicheData {
  consultation: {
    id: string
    consultationNumber: string
    motif: string
    symptoms?: string[]
    vitalSigns?: Record<string, unknown>
    notes?: string
    provisionalDiagnosis?: string
    status: string
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

export default function ConsultationFichePage() {
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
        const result = await api.get<FicheData>(`/consultations/${id}/fiche`, token)
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
        <p className="mt-2 text-sm text-muted-foreground">{error || 'La consultation demandée n\'existe pas.'}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { consultation, patient, doctor, facility } = data

  return (
    <FicheLayout
      title="FICHE DE CONSULTATION"
      subtitle={consultation.consultationNumber}
      facility={facility}
      patient={patient}
      doctor={doctor}
      createdAt={consultation.createdAt}
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Motif de consultation</h3>
          <p className="rounded-lg border border-gray-200 p-3 text-sm">{consultation.motif}</p>
        </div>

        {consultation.symptoms && consultation.symptoms.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Symptômes</h3>
            <div className="flex flex-wrap gap-2">
              {consultation.symptoms.map((s, i) => (
                <span key={i} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {consultation.vitalSigns && Object.keys(consultation.vitalSigns).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Signes vitaux</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(consultation.vitalSigns).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-gray-200 p-2 text-center">
                  <p className="text-xs text-gray-500 uppercase">{key}</p>
                  <p className="text-sm font-medium">{String(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {consultation.provisionalDiagnosis && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Diagnostic provisoire</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{consultation.provisionalDiagnosis}</p>
          </div>
        )}

        {consultation.notes && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Notes</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">{consultation.notes}</p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Statut</h3>
          <p className="text-sm font-medium">
            {consultation.status === 'WAITING' && 'En attente'}
            {consultation.status === 'IN_PROGRESS' && 'En cours'}
            {consultation.status === 'COMPLETED' && 'Terminée'}
            {consultation.status === 'CANCELLED' && 'Annulée'}
          </p>
        </div>
      </div>
    </FicheLayout>
  )
}
