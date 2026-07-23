'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertCircle,
  Pill,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { api } from '@/services/api'

interface OrdonnanceData {
  treatment: {
    id: string
    description: string
    status: string
    startDate: string
    endDate?: string
    notes?: string
    outcome?: string
    createdAt: string
  }
  prescriptions: Array<{
    id: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
    quantity?: number
    medicationName?: string
    medicationGenericName?: string
    medicationForm?: string
    medicationDosage?: string
  }>
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

export default function OrdonnancePage() {
  const { treatmentId } = useParams<{ treatmentId: string }>()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<OrdonnanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrdonnance = async () => {
      try {
        const token = localStorage.getItem('dhayaro_token')
        if (!token) {
          router.push('/login')
          return
        }
        const result = await api.get<OrdonnanceData>(
          `/treatments/${treatmentId}/ordonnance`,
          token
        )
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    if (treatmentId) {
      fetchOrdonnance()
    }
  }, [treatmentId, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de l&apos;ordonnance...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Ordonnance non trouvée
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || 'Le traitement demandé n&apos;existe pas ou n&apos;a pas de prescriptions.'}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const { treatment, prescriptions, patient, doctor, facility } = data

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div ref={printRef} className="ordonnance-print rounded-lg border bg-white p-8 text-black shadow-sm">
        <div className="mb-8 text-center">
          {facility && (
            <>
              <h1 className="text-2xl font-bold text-primary">{facility.name}</h1>
              {facility.address && (
                <p className="text-sm text-gray-600">{facility.address}</p>
              )}
              {facility.city && (
                <p className="text-sm text-gray-600">{facility.city}</p>
              )}
              {facility.phone && (
                <p className="text-sm text-gray-600">Tél: {facility.phone}</p>
              )}
            </>
          )}
          <div className="mt-4 border-t-2 border-primary pt-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">ORDONNANCE MÉDICALE</h2>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Patient</h3>
            {patient ? (
              <div className="space-y-1">
                <p className="font-medium">
                  {patient.firstname} {patient.lastname}
                </p>
                {patient.dateOfBirth && (
                  <p className="text-sm text-gray-600">
                    Né(e) le: {formatDate(patient.dateOfBirth)}
                  </p>
                )}
                {patient.sex && (
                  <p className="text-sm text-gray-600">
                    Sexe: {patient.sex === 'M' ? 'Masculin' : 'Féminin'}
                  </p>
                )}
                {patient.bloodGroup && (
                  <p className="text-sm text-gray-600">
                    Groupe sanguin: {patient.bloodGroup}
                  </p>
                )}
                {patient.phone && (
                  <p className="text-sm text-gray-600">Tél: {patient.phone}</p>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <p className="text-sm font-medium text-red-600">
                    Allergies: {patient.allergies.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Patient inconnu</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Médecin prescripteur</h3>
            {doctor ? (
              <div className="space-y-1">
                <p className="font-medium">
                  Dr. {doctor.firstname} {doctor.lastname}
                </p>
                {doctor.specialty && (
                  <p className="text-sm text-gray-600">
                    Spécialité: {doctor.specialty}
                  </p>
                )}
                {doctor.phone && (
                  <p className="text-sm text-gray-600">Tél: {doctor.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Médecin inconnu</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Diagnostic / Traitement</h3>
          <p className="rounded-lg border border-gray-200 p-3 text-sm">
            {treatment.description}
          </p>
          {treatment.notes && (
            <p className="mt-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {treatment.notes}
            </p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">Prescriptions</h3>
          {prescriptions.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-2 text-left font-semibold">Médicament</th>
                  <th className="py-2 text-left font-semibold">Dosage</th>
                  <th className="py-2 text-left font-semibold">Fréquence</th>
                  <th className="py-2 text-left font-semibold">Durée</th>
                  <th className="py-2 text-left font-semibold">Qté</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="border-b border-gray-200">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{rx.medicationName || 'Inconnu'}</p>
                          {rx.medicationGenericName && rx.medicationGenericName !== rx.medicationName && (
                            <p className="text-xs text-gray-500">{rx.medicationGenericName}</p>
                          )}
                          {rx.medicationForm && (
                            <p className="text-xs text-gray-500">{rx.medicationForm}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {rx.medicationDosage && (
                        <p className="text-xs text-gray-500">{rx.medicationDosage}</p>
                      )}
                      <p>{rx.dosage}</p>
                    </td>
                    <td className="py-3">{rx.frequency}</td>
                    <td className="py-3">{rx.duration}</td>
                    <td className="py-3">{rx.quantity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic">Aucune prescription</p>
          )}
        </div>

        {prescriptions.some((rx) => rx.instructions) && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Instructions particulières</h3>
            <div className="space-y-1">
              {prescriptions
                .filter((rx) => rx.instructions)
                .map((rx) => (
                  <p key={rx.id} className="text-sm text-gray-600">
                    <span className="font-medium">{rx.medicationName}:</span> {rx.instructions}
                  </p>
                ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-gray-200 pt-6">
          <div>
            <p className="text-sm text-gray-500">Date de prescription</p>
            <p className="font-medium">{formatDate(treatment.startDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Signature du médecin</p>
            <div className="mt-8 border-t border-gray-400 pt-2">
              <p className="text-sm font-medium">
                Dr. {doctor?.firstname} {doctor?.lastname}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
