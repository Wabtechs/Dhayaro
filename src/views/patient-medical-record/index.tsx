'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { FileText, Stethoscope, Pill, FlaskConical, AlertCircle, Calendar } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Terminé',
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours',
  CANCELLED: 'Annulé',
  PRESCRIBED: 'Prescrit',
  REQUESTED: 'Demandé',
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PRESCRIBED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  REQUESTED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export default function PatientMedicalRecordView() {
  const { token } = usePatientAuthStore()
  const [data, setData] = useState<{
    consultations: unknown[]
    diagnostics: unknown[]
    treatments: unknown[]
    labExams: unknown[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/patient/dashboard`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
    ])
      .then(([dashboard]) => setData({
        consultations: dashboard?.lastConsultation ? [dashboard.lastConsultation] : [],
        diagnostics: [],
        treatments: dashboard?.activeTreatments || [],
        labExams: dashboard?.recentLabExams || [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mon dossier médical</h1>

      <Tabs defaultValue="consultations">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="consultations" className="flex items-center gap-1">
            <Stethoscope className="h-3.5 w-3.5" /> Consultations
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex items-center gap-1">
            <Pill className="h-3.5 w-3.5" /> Traitements
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-1">
            <FlaskConical className="h-3.5 w-3.5" /> Examens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.consultations || data.consultations.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune consultation</p>
              ) : (
                <div className="divide-y">
                  {(data.consultations as Array<{ id: string; motif: string; status: string; createdAt: string; doctorFirstname?: string; doctorLastname?: string }>).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{c.motif}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.doctorFirstname && c.doctorLastname ? `Dr. ${c.doctorFirstname} ${c.doctorLastname} · ` : ''}
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status] || c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.treatments || data.treatments.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun traitement</p>
              ) : (
                <div className="divide-y">
                  {(data.treatments as Array<{ id: string; description: string; status: string; startDate: string; endDate?: string; doctorFirstname?: string; doctorLastname?: string }>).map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.doctorFirstname && t.doctorLastname ? `Dr. ${t.doctorFirstname} ${t.doctorLastname} · ` : ''}
                          Début: {formatDate(t.startDate)}
                          {t.endDate ? ` · Fin: ${formatDate(t.endDate)}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status] || t.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.labExams || data.labExams.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun examen</p>
              ) : (
                <div className="divide-y">
                  {(data.labExams as Array<{ id: string; examName: string; status: string; createdAt: string; results?: Record<string, unknown> }>).map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{e.examName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                      </div>
                      <Badge variant="outline" className={STATUS_COLORS[e.status]}>{STATUS_LABELS[e.status] || e.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
