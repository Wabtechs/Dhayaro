'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { FicheLayout } from '@/components/fiche-layout'
import { api } from '@/services/api'

interface FicheData {
  diagnostic: {
    id: string
    diagnosticType: string
    description: string
    notes?: string
    isValidated: boolean
    validatedAt?: string
    createdAt: string
  }
  disease: {
    id: string
    code?: string
    name?: string
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

export default function DiagnosticFichePage() {
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
        const result = await api.get<FicheData>(`/diagnostics/${id}/fiche`, token)
        setData(result)
      } catch (err) {
        setError('Impossible de charger les données du diagnostic. Veuillez réessayer.')
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
        <p className="mt-2 text-sm text-muted-foreground">{error || 'Le diagnostic demandé n\'existe pas.'}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { diagnostic, disease, patient, doctor, facility } = data

  return (
    <FicheLayout
      title="FICHE DE DIAGNOSTIC"
      subtitle={diagnostic.diagnosticType}
      facility={facility}
      patient={patient}
      doctor={doctor}
      createdAt={diagnostic.createdAt}
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        {disease && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Maladie identifiée</h3>
            <div className="rounded-lg border border-gray-200 p-3">
              {disease.code && <p className="text-xs text-gray-500">{disease.code}</p>}
              <p className="text-sm font-medium">{disease.name}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Description du diagnostic</h3>
          <p className="rounded-lg border border-gray-200 p-3 text-sm">{diagnostic.description}</p>
        </div>

        {diagnostic.notes && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Notes cliniques</h3>
            <p className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">{diagnostic.notes}</p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Statut de validation</h3>
          <p className="text-sm font-medium">
            {diagnostic.isValidated ? (
              <span className="text-green-600">
                Validé {diagnostic.validatedAt && `le ${new Date(diagnostic.validatedAt).toLocaleDateString('fr-FR')}`}
              </span>
            ) : (
              <span className="text-orange-600">En attente de validation</span>
            )}
          </p>
        </div>
      </div>
    </FicheLayout>
  )
}
