'use client'

import { useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwa } from '@/hooks/use-pwa'

const STORAGE_KEY = 'dhayaro_pwa_banner_dismissed'

export function InstallBanner() {
  const { status, promptInstall } = usePwa()
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  })

  const show = (status === 'installable' || status === 'ios') && !dismissed
  if (!show) return null

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const handleInstall = async () => {
    if (status === 'ios') return
    const installed = await promptInstall()
    if (installed) {
      setDismissed(true)
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-2 text-sm">
      <Smartphone className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-muted-foreground">
        {status === 'ios' ? (
          <>
            Installez Dhayaro : touchez <span className="font-medium text-foreground">Partager</span> puis{' '}
            <span className="font-medium text-foreground">Ajouter à l&apos;écran d&apos;accueil</span> pour l&apos;utiliser
            hors ligne.
          </>
        ) : (
          <>Installez Dhayaro pour un accès rapide et une utilisation hors ligne.</>
        )}
      </p>
      {status === 'installable' && (
        <Button size="sm" onClick={handleInstall}>
          <Download className="mr-1 h-4 w-4" /> Installer
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={handleDismiss} aria-label="Fermer">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
