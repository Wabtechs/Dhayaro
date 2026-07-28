'use client'

import { useRef, useState } from 'react'
import {
  ArrowLeft,
  Printer,
  Loader2,
  FileDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export interface FicheFacility {
  name: string
  address?: string
  city?: string
  phone?: string
}

export interface FichePatient {
  firstname: string
  lastname: string
  dateOfBirth?: string
  sex?: string
  bloodGroup?: string
  phone?: string
  address?: string
  allergies?: string[]
}

export interface FicheDoctor {
  firstname: string
  lastname: string
  specialty?: string
}

export interface FicheLayoutProps {
  title: string
  subtitle?: string
  facility: FicheFacility | null
  patient: FichePatient | null
  doctor: FicheDoctor | null
  createdAt: string
  children: React.ReactNode
  signatureName?: string
  onBack?: () => void
}

export function FicheLayout({
  title,
  subtitle,
  facility,
  patient,
  doctor,
  createdAt,
  children,
  signatureName,
  onBack,
}: FicheLayoutProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [printing, setPrinting] = useState(false)

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button size="sm" onClick={handlePrint} disabled={printing}>
          {printing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          Imprimer
        </Button>
      </div>

      <div ref={printRef} className="fiche-print rounded-lg border bg-white p-8 text-black shadow-sm">
        <div className="mb-6 text-center">
          {facility && (
            <>
              <h1 className="text-2xl font-bold text-primary">{facility.name}</h1>
              {facility.address && <p className="text-sm text-gray-600">{facility.address}</p>}
              {facility.city && <p className="text-sm text-gray-600">{facility.city}</p>}
              {facility.phone && <p className="text-sm text-gray-600">Tél: {facility.phone}</p>}
            </>
          )}
          <div className="mt-4 border-t-2 border-primary pt-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Patient</h3>
            {patient ? (
              <div className="space-y-1">
                <p className="font-medium">{patient.firstname} {patient.lastname}</p>
                {patient.dateOfBirth && <p className="text-sm text-gray-600">Né(e) le: {formatDate(patient.dateOfBirth)}</p>}
                {patient.sex && <p className="text-sm text-gray-600">Sexe: {patient.sex === 'M' ? 'Masculin' : patient.sex === 'F' ? 'Féminin' : patient.sex}</p>}
                {patient.bloodGroup && <p className="text-sm text-gray-600">Groupe sanguin: {patient.bloodGroup}</p>}
                {patient.phone && <p className="text-sm text-gray-600">Tél: {patient.phone}</p>}
                {patient.allergies && patient.allergies.length > 0 && (
                  <p className="text-sm font-medium text-red-600">Allergies: {patient.allergies.join(', ')}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Patient inconnu</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">Médecin</h3>
            {doctor ? (
              <div className="space-y-1">
                <p className="font-medium">Dr. {doctor.firstname} {doctor.lastname}</p>
                {doctor.specialty && <p className="text-sm text-gray-600">Spécialité: {doctor.specialty}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Médecin inconnu</p>
            )}
          </div>
        </div>

        {children}

        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-gray-200 pt-6">
          <div>
            <p className="text-sm text-gray-500">Date du document</p>
            <p className="font-medium">{formatDate(createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Signature du médecin</p>
            <div className="mt-8 border-t border-gray-400 pt-2">
              <p className="text-sm font-medium">
                Dr. {signatureName || `${doctor?.firstname} ${doctor?.lastname}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
