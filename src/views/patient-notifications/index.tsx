'use client'

import { useEffect, useState } from 'react'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const TYPE_ICONS: Record<string, typeof Bell> = { INFO: Info, WARNING: AlertTriangle, SUCCESS: CheckCircle, ERROR: XCircle }
const TYPE_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function PatientNotificationsView() {
  const { token } = usePatientAuthStore()
  const [items, setItems] = useState<Array<{ id: string; title: string; message: string; type: string; createdAt: string; isRead: boolean }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="py-20 text-center text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mes notifications</h1>
      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune notification</p>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell
                return (
                  <div key={n.id} className={`flex items-start gap-3 py-3 ${!n.isRead ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`mt-0.5 rounded-full p-1.5 ${TYPE_COLORS[n.type] || ''}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
