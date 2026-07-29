'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FlaskConical, Clock } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Demandé', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}
const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function PatientLabExamsView() {
  const { token } = usePatientAuthStore()
  const [items, setItems] = useState<Array<{
    id: string, examName: string, status: string, results?: Record<string, unknown>
    resultNotes?: string, clinicalIndication?: string, requestedAt: string
    completedAt?: string, categoryName?: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/patient/lab-exams?size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setItems(d?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-1 h-5 w-5 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-64" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes examens</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucun examen trouvé.</p>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FlaskConical className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{e.examName}</p>
                      {e.categoryName && (
                        <p className="text-xs text-muted-foreground">{e.categoryName}</p>
                      )}
                      {e.clinicalIndication && (
                        <p className="mt-1 text-sm text-muted-foreground">{e.clinicalIndication}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Demandé: {formatDate(e.requestedAt)}
                        </span>
                        {e.completedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Résultat: {formatDate(e.completedAt)}
                          </span>
                        )}
                      </div>
                      {e.resultNotes && (
                        <p className="mt-2 text-sm font-medium text-muted-foreground">
                          Note: {e.resultNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[e.status]}>
                    {STATUS_LABELS[e.status] || e.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
