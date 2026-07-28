'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'

type AccountGroup = { label: string; email: string; password: string; role: string }

const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE', 'LABORATORY', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST', 'PATIENT']

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  RECEPTIONIST: 'Réceptionniste',
  DOCTOR: 'Médecin',
  SPECIALIST: 'Spécialiste',
  NURSE: 'Infirmier',
  LABORATORY: 'Laborantin',
  PHARMACIST: 'Pharmacien',
  ACCOUNTANT: 'Comptable',
  ARCHIVIST: 'Archiviste',
  PATIENT: 'Patient',
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  RECEPTIONIST: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  DOCTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SPECIALIST: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  NURSE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  LABORATORY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  PHARMACIST: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  ACCOUNTANT: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  ARCHIVIST: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  PATIENT: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
}

const accounts: AccountGroup[] = [
  { label: 'Super Admin', email: 'superadmin@dhayaro.cd', password: 'admin123', role: 'SUPER_ADMIN' },
  { label: 'Admin', email: 'admin@dhayaro.cd', password: 'admin123', role: 'ADMIN' },
  { label: 'Réceptionniste', email: 'reception@dhayaro.cd', password: 'dhayaro123', role: 'RECEPTIONIST' },
  { label: 'Dr. Kabongo', email: 'dr.kabongo@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. Clovis', email: 'dr.clovis@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. Sylvain', email: 'dr.sylvain@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. Pierre', email: 'dr.pierre@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. Françoise', email: 'dr.francoise@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. André', email: 'dr.andre@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. David', email: 'dr.david@dhayaro.cd', password: 'doctor123', role: 'DOCTOR' },
  { label: 'Dr. Espérance', email: 'dr.esperance@dhayaro.cd', password: 'doctor123', role: 'SPECIALIST' },
  { label: 'Dr. Grâce', email: 'dr.grace@dhayaro.cd', password: 'doctor123', role: 'SPECIALIST' },
  { label: 'Dr. Marie', email: 'dr.marie@dhayaro.cd', password: 'doctor123', role: 'SPECIALIST' },
  { label: 'Inf. Mohamed', email: 'nurse.mohamed@dhayaro.cd', password: 'nurse123', role: 'NURSE' },
  { label: 'Inf. Cécile', email: 'nurse.cecile@dhayaro.cd', password: 'nurse123', role: 'NURSE' },
  { label: 'Labo Joseph', email: 'lab.joseph@dhayaro.cd', password: 'dhayaro123', role: 'LABORATORY' },
  { label: 'Pharmacienne', email: 'pharm.beatrice@dhayaro.cd', password: 'dhayaro123', role: 'PHARMACIST' },
  { label: 'Comptable', email: 'compta.augustin@dhayaro.cd', password: 'dhayaro123', role: 'ACCOUNTANT' },
  { label: 'Archiviste', email: 'archive.monique@dhayaro.cd', password: 'dhayaro123', role: 'ARCHIVIST' },
  { label: 'Patient Marcel', email: 'patient.marcel@dhayaro.cd', password: 'patient123', role: 'PATIENT' },
  { label: 'Patient Solange', email: 'patient.solange@dhayaro.cd', password: 'patient123', role: 'PATIENT' },
  { label: 'Patient Prosper', email: 'patient.prosper@dhayaro.cd', password: 'patient123', role: 'PATIENT' },
]

const grouped = roleOrder.reduce((acc, role) => {
  const roleAccounts = accounts.filter(a => a.role === role)
  if (roleAccounts.length > 0) acc[role] = roleAccounts
  return acc
}, {} as Record<string, AccountGroup[]>)

export default function TestAccountsPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const quickLogin = async (acc: AccountGroup) => {
    setLoading(acc.email)
    setError('')
    try {
      await login(acc.email, acc.password)
      router.push('/dashboard')
    } catch {
      setError(`Échec de connexion pour ${acc.label}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/login')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Comptes de test</h1>
              <p className="text-sm text-muted-foreground">
                Cliquez sur un compte pour vous connecter instantanément
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(grouped).map(([role, roleAccounts]) => (
            <Card key={role}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="outline" className={roleColors[role] || ''}>
                    {roleLabels[role] || role}
                  </Badge>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({roleAccounts.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading !== null}
                    onClick={() => quickLogin(acc)}
                    className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {acc.label}
                      </span>
                      <p className="text-xs text-muted-foreground">{acc.email}</p>
                    </div>
                    {loading === acc.email ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
