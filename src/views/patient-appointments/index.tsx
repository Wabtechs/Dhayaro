'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, Stethoscope } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = { WAITING: 'En attente', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé', WITH_DOCTOR: 'Chez le médecin' }
const STATUS_COLORS: Record<string, string> = {
  WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  WITH_DOCTOR: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

export default function PatientAppointmentsView() {
  const { token } = usePatientAuthStore()
  const [items, setItems] = useState<Array<{ id: string; motif: string; status: string; createdAt: string; doctorFirstname?: string; doctorLastname?: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/patient/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list: Array<{ id: string; motif: string; status: string; createdAt: string; doctorFirstname?: string; doctorLastname?: string }> = []
        if (d?.nextConsultation) list.push(d.nextConsultation)
        if (d?.lastConsultation) list.push(d.lastConsultation)
        setItems(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="py-20 text-center text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes rendez-vous</h1>
      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun rendez-vous</p>
          ) : (
            <div className="divide-y">
              {items.map((r) => (
                <div key={r.id} className="flex items-start gap-3 py-3">
                  <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{r.motif}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {formatDate(r.createdAt)}
                      {r.doctorFirstname && ` · Dr. ${r.doctorFirstname} ${r.doctorLastname}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${STATUS_COLORS[r.status]} border-0`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
