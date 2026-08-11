'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FicheLayout } from '@/components/fiche-layout'
import { api } from '@/services/api'

interface FicheData {
  exam: {
    id: string
    examName: string
    clinicalIndication?: string
    status: string
    results?: Record<string, unknown>
    resultNotes?: string
    validatedAt?: string
    requestedAt?: string
    completedAt?: string
    createdAt: string
  }
  category: {
    id: string
    name: string
  } | null
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

export default function LabExamFichePage() {
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
        const result = await api.get<FicheData>(`/lab/exams/${id}/fiche`, token)
        setData(result)
      } catch (err) {
        setError('Impossible de charger les données de l\'examen. Veuillez réessayer.')
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
        <p className="mt-2 text-sm text-muted-foreground">{error || 'L\'examen demandé n\'existe pas.'}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { exam, category, patient, doctor, facility } = data

  return (
    <FicheLayout
      title="FICHE D'EXAMEN LABORATOIRE"
      subtitle={category?.name || exam.examName}
      facility={facility}
      patient={patient}
      doctor={doctor}
      createdAt={exam.createdAt}
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Examen</h3>
          <p className="rounded-lg border border-gray-200 p-3 text-sm font-medium">{exam.examName}</p>
        </div>

        {exam.clinicalIndication && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Indication clinique</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm">{exam.clinicalIndication}</p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Statut</h3>
          <p className="text-sm font-medium">
            {exam.status === 'REQUESTED' && 'Demandé'}
            {exam.status === 'IN_PROGRESS' && 'En cours'}
            {exam.status === 'COMPLETED' && 'Terminé'}
            {exam.status === 'CANCELLED' && 'Annulé'}
          </p>
        </div>

        {exam.results && Object.keys(exam.results).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Résultats</h3>
            <div className="rounded-lg border border-gray-200 p-3">
              {Object.entries(exam.results).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                  <span className="text-sm text-gray-600">{key}</span>
                  <span className="text-sm font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {exam.resultNotes && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Notes du laboratoire</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">{exam.resultNotes}</p>
          </div>
        )}

        {exam.completedAt && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Date de complétion</h3>
            <p className="text-sm font-medium">{new Date(exam.completedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>
    </FicheLayout>
  )
}
