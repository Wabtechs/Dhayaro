'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Pill, Calendar } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = {
  PRESCRIBED: 'Prescrit', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé',
  CANCELLED: 'Annulé', SUSPENDED: 'Suspendu',
}
const STATUS_COLORS: Record<string, string> = {
  PRESCRIBED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

export default function PatientTreatmentsView() {
  const { token } = usePatientAuthStore()
  const [items, setItems] = useState<Array<{
    id: string, description: string, status: string, startDate: string
    endDate?: string, notes?: string, doctorFirstname?: string, doctorLastname?: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/patient/treatments?size=50`, {
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
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-32" />
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
      <h1 className="text-2xl font-bold tracking-tight">Mes traitements</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucun traitement trouvé.</p>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Pill className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.doctorFirstname && t.doctorLastname
                          ? `Dr. ${t.doctorFirstname} ${t.doctorLastname}`
                          : 'Médecin non spécifié'}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Début: {formatDate(t.startDate)}
                        </span>
                        {t.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Fin: {formatDate(t.endDate)}
                          </span>
                        )}
                      </div>
                      {t.notes && <p className="mt-2 text-sm text-muted-foreground">{t.notes}</p>}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[t.status]}>
                    {STATUS_LABELS[t.status] || t.status}
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
