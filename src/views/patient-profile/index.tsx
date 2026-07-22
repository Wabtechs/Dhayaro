'use client'

import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Phone, MapPin, Droplets, Heart, AlertTriangle, UserCircle, Building2, Calendar } from 'lucide-react'

export default function PatientProfileView() {
  const { patient } = usePatientAuthStore()

  if (!patient) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  const infoBlocks = [
    { icon: User, label: 'Nom complet', value: `${patient.firstname} ${patient.lastname}` },
    { icon: Calendar, label: 'Date de naissance', value: patient.dateOfBirth || 'Non renseigné' },
    { icon: UserCircle, label: 'Sexe', value: patient.sex === 'M' ? 'Masculin' : patient.sex === 'F' ? 'Féminin' : 'Autre' },
    { icon: Droplets, label: 'Groupe sanguin', value: patient.bloodGroup || 'Non renseigné' },
    { icon: Phone, label: 'Téléphone', value: patient.phone || 'Non renseigné' },
    { icon: MapPin, label: 'Adresse', value: [patient.address, patient.city].filter(Boolean).join(', ') || 'Non renseigné' },
    { icon: Building2, label: 'Établissement', value: patient.facilityName || 'Non renseigné' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes informations</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Identité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {infoBlocks.map((block) => {
              const Icon = block.icon
              return (
                <div key={block.label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{block.label}</p>
                    <p className="text-sm font-medium break-words">{block.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {patient.allergies && patient.allergies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a, i) => (
                <Badge key={i} variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  {a}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" />
            Contact d&apos;urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.emergencyContactName ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{patient.emergencyContactName}</p>
              {patient.emergencyContactRelation && (
                <p className="text-xs text-muted-foreground">{patient.emergencyContactRelation}</p>
              )}
              {patient.emergencyContactPhone && (
                <p className="text-sm text-muted-foreground">{patient.emergencyContactPhone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun contact d&apos;urgence renseigné</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
