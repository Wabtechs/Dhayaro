'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePatientAuthStore } from '@/store/patient-auth-store'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  User,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  Calendar,
  Bell,
  LogOut,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Mes informations', href: '/patient/profile', icon: User },
  { label: 'Mon dossier médical', href: '/patient/medical-record', icon: FileText },
  { label: 'Mes consultations', href: '/patient/consultations', icon: Stethoscope },
  { label: 'Mes traitements', href: '/patient/treatments', icon: Pill },
  { label: 'Mes examens', href: '/patient/lab-exams', icon: FlaskConical },
  { label: 'Mes rendez-vous', href: '/patient/appointments', icon: Calendar },
  { label: 'Mes notifications', href: '/patient/notifications', icon: Bell },
]

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, patient, token, loadSession } = usePatientAuthStore()

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    if (!token && pathname !== '/patient/login') {
      router.push('/patient/login')
    }
  }, [token, pathname, router])

  if (!token && pathname !== '/patient/login') {
    return null
  }

  if (pathname === '/patient/login') {
    return <>{children}</>
  }

  const fullName = patient
    ? `${patient.firstname} ${patient.lastname}`
    : user
      ? `${user.firstname} ${user.lastname}`
      : 'Patient'

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">Mon Espace Santé</span>
        </div>

        <div className="flex flex-col items-center border-b p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials}
          </div>
          <p className="mt-2 text-sm font-medium">{fullName}</p>
          {patient?.facilityName && (
            <p className="text-xs text-muted-foreground">{patient.facilityName}</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => {
              const { logout } = usePatientAuthStore.getState()
              logout()
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 md:hidden">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Mon Espace Santé</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
