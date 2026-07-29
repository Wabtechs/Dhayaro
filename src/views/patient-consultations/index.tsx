'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Stethoscope, Clock } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const STATUS_LABELS: Record<string, string> = { COMPLETED: 'Terminé', WAITING: 'En attente', IN_PROGRESS: 'En cours', CANCELLED: 'Annulé' }
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function PatientConsultationsView() {
  const { token } = usePatientAuthStore()
  const [items, setItems] = useState<Array<{
    id: string; consultationNumber?: string; motif: string; status: string
    createdAt: string; doctorFirstname?: string; doctorLastname?: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/patient/consultations?size=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setItems(d?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="py-20 text-center text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes consultations</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucune consultation trouvée.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                  <Stethoscope className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{c.motif}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.doctorFirstname && c.doctorLastname
                        ? `Dr. ${c.doctorFirstname} ${c.doctorLastname}`
                        : 'Médecin non spécifié'}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(c.createdAt)}
                      {c.consultationNumber && <span> · N° {c.consultationNumber}</span>}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                  {STATUS_LABELS[c.status] || c.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
