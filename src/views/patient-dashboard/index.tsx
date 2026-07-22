'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  Activity,
  User,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DashboardData {
  nextConsultation: {
    id: string
    consultationNumber: string
    motif: string
    status: string
    createdAt: string
    doctorFirstname: string
    doctorLastname: string
  } | null
  lastConsultation: {
    id: string
    consultationNumber: string
    motif: string
    status: string
    createdAt: string
    doctorFirstname: string
    doctorLastname: string
  } | null
  queueEntry: {
    id: string
    ticketNumber: string
    status: string
    queuePosition?: number
    estimatedWaitMinutes?: number
  } | null
  activeTreatments: {
    id: string
    description: string
    status: string
    startDate: string
    endDate?: string
    doctorFirstname: string
    doctorLastname: string
  }[]
  recentLabExams: {
    id: string
    examName: string
    status: string
    results: Record<string, unknown>
    createdAt: string
    completedAt?: string
  }[]
  recentDocuments: {
    id: string
    title: string
    documentType: string
    createdAt: string
    doctorFirstname: string
    doctorLastname: string
  }[]
  lastPrescriptions: {
    id: string
    description: string
    startDate: string
    endDate?: string
    status: string
    doctorFirstname: string
    doctorLastname: string
  }[]
  totalConsultations: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  PRESCRIBED: 'Prescrit',
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PRESCRIBED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

export default function PatientDashboardView() {
  const { patient, token } = usePatientAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/patient/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Chargement de votre espace santé...
        </div>
      </div>
    )
  }

  const fullName = patient ? `${patient.firstname} ${patient.lastname}` : 'Patient'
  const age = patient?.age
  const bloodGroup = patient?.bloodGroup

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonjour, {fullName}</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue dans votre espace santé personnel
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Consultations</p>
              <p className="text-2xl font-bold">{data?.totalConsultations ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Traitements en cours</p>
              <p className="text-2xl font-bold">{data?.activeTreatments?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Examens récents</p>
              <p className="text-2xl font-bold">{data?.recentLabExams?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold">{data?.recentDocuments?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data?.nextConsultation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Prochaine consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{data.nextConsultation.motif}</p>
                <p className="text-sm text-muted-foreground">
                  Dr. {data.nextConsultation.doctorFirstname} {data.nextConsultation.doctorLastname}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(data.nextConsultation.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.queueEntry && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-amber-500" />
                File d&apos;attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-bold">Ticket #{data.queueEntry.ticketNumber}</p>
                <Badge variant="outline" className={STATUS_COLORS[data.queueEntry.status]}>
                  {STATUS_LABELS[data.queueEntry.status] || data.queueEntry.status}
                </Badge>
                {data.queueEntry.queuePosition && (
                  <p className="text-sm text-muted-foreground">
                    Position: {data.queueEntry.queuePosition}
                  </p>
                )}
                {data.queueEntry.estimatedWaitMinutes && (
                  <p className="text-sm text-muted-foreground">
                    Temps estimé: {data.queueEntry.estimatedWaitMinutes} min
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {data?.activeTreatments && data.activeTreatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4 text-primary" />
              Traitements en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.activeTreatments.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Dr. {t.doctorFirstname} {t.doctorLastname} · Début: {formatDate(t.startDate)}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[t.status]}>
                    {STATUS_LABELS[t.status] || t.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data?.recentLabExams && data.recentLabExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-primary" />
              Derniers examens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentLabExams.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{e.examName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[e.status]}>
                    {STATUS_LABELS[e.status] || e.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Mes informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Nom complet</p>
                <p className="text-sm font-medium">{patient.firstname} {patient.lastname}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Âge</p>
                <p className="text-sm font-medium">{age ?? 'Non renseigné'} ans</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Groupe sanguin</p>
                <p className="text-sm font-medium">{bloodGroup ?? 'Non renseigné'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">{patient.phone ?? 'Non renseigné'}</p>
              </div>
              {patient.facilityName && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Établissement</p>
                  <p className="text-sm font-medium">{patient.facilityName}</p>
                </div>
              )}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {patient.emergencyContactName && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Contact d&apos;urgence</p>
                  <p className="text-sm font-medium">
                    {patient.emergencyContactName}
                    {patient.emergencyContactRelation && ` (${patient.emergencyContactRelation})`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
