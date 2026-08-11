'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Stethoscope, Pill, FlaskConical, ClipboardList, FileText, Download, Eye, Loader2,
} from 'lucide-react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Terminé',
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours',
  CANCELLED: 'Annulé',
  PRESCRIBED: 'Prescrit',
  REQUESTED: 'Demandé',
  SUSPENDED: 'Suspendu',
  PROVISIONAL: 'Provisoire',
  FINAL: 'Définitif',
  DIFFERENTIAL: 'Différentiel',
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PRESCRIBED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  REQUESTED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  PROVISIONAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  FINAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DIFFERENTIAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

const DOCUMENT_LABELS: Record<string, string> = {
  PRESCRIPTION: 'Prescription',
  CERTIFICATE: 'Certificat',
  REPORT: 'Compte-rendu',
  LAB_RESULT: 'Résultat labo',
  REFERRAL: 'Orientation',
  ORDONNANCE: 'Ordonnance',
}

interface Consultation {
  id: string; motif: string; status: string; createdAt: string
  doctorFirstname?: string; doctorLastname?: string
}
interface Diagnostic {
  id: string; diagnosticType: string; description: string; notes?: string
  isValidated: boolean; diseaseCode?: string; diseaseName?: string
  createdAt: string; doctorFirstname?: string; doctorLastname?: string
}
interface Treatment {
  id: string; description: string; status: string; startDate: string
  endDate?: string; doctorFirstname?: string; doctorLastname?: string
}
interface LabExam {
  id: string; examName: string; status: string; createdAt: string
}
interface PatientDocument {
  id: string; title: string; documentType: string; createdAt: string
  doctorFirstname?: string; doctorLastname?: string
}

export default function PatientMedicalRecordView() {
  const { token } = usePatientAuthStore()
  const [data, setData] = useState<{
    consultations: Consultation[]
    diagnostics: Diagnostic[]
    treatments: Treatment[]
    labExams: LabExam[]
    documents: PatientDocument[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/patient/dashboard`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/patient/diagnostics?size=50`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/patient/documents?size=50`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
    ])
      .then(([dashboard, diagnostics, documents]) => setData({
        consultations: dashboard?.lastConsultation ? [dashboard.lastConsultation] : [],
        diagnostics: diagnostics?.items || [],
        treatments: dashboard?.activeTreatments || [],
        labExams: dashboard?.recentLabExams || [],
        documents: documents?.items || [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const handleDownload = async (documentId: string, title: string) => {
    if (!token) return
    setDownloading(documentId)
    try {
      const res = await fetch(`${API_BASE}/patient/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || documentId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-md" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <TabsTrigger value="diagnostics" className="flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> Diagnostics
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.consultations || data.consultations.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune consultation</p>
              ) : (
                <div className="divide-y">
                  {data.consultations.map((c) => (
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
                  {data.treatments.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.doctorFirstname && t.doctorLastname ? `Dr. ${t.doctorFirstname} ${t.doctorLastname} · ` : ''}
                          Début: {formatDate(t.startDate)}
                          {t.endDate ? ` · Fin: ${formatDate(t.endDate)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
                          <Link href={`/patient/ordonnance/${t.id}`}>
                            <Eye className="h-3.5 w-3.5" /> Ordonnance
                          </Link>
                        </Button>
                        <Badge variant="outline" className={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status] || t.status}</Badge>
                      </div>
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
                  {data.labExams.map((e) => (
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

        <TabsContent value="diagnostics" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.diagnostics || data.diagnostics.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun diagnostic</p>
              ) : (
                <div className="divide-y">
                  {data.diagnostics.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{d.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.diseaseName && (
                            <>
                              {d.diseaseCode ? `[${d.diseaseCode}] ` : ''}{d.diseaseName} ·{' '}
                            </>
                          )}
                          {d.doctorFirstname && d.doctorLastname ? `Dr. ${d.doctorFirstname} ${d.doctorLastname} · ` : ''}
                          {formatDate(d.createdAt)}
                        </p>
                        {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {d.isValidated && (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Validé</Badge>
                        )}
                        <Badge variant="outline" className={STATUS_COLORS[d.diagnosticType]}>{STATUS_LABELS[d.diagnosticType] || d.diagnosticType}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {(!data?.documents || data.documents.length === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun document</p>
              ) : (
                <div className="divide-y">
                  {data.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.doctorFirstname && doc.doctorLastname ? `Dr. ${doc.doctorFirstname} ${doc.doctorLastname} · ` : ''}
                          {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          disabled={downloading === doc.id}
                          onClick={() => handleDownload(doc.id, doc.title)}
                        >
                          {downloading === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </Button>
                        <Badge variant="outline">{DOCUMENT_LABELS[doc.documentType] || doc.documentType}</Badge>
                      </div>
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
