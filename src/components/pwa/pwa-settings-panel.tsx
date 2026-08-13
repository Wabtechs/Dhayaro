'use client'

import { useState } from 'react'
import { Download, RefreshCw, Trash2, CheckCircle2, Smartphone, Globe, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePwa } from '@/hooks/use-pwa'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  installed: { label: 'Installée', variant: 'default' },
  installable: { label: 'Installation disponible', variant: 'secondary' },
  ios: { label: 'Installer sur iOS', variant: 'outline' },
  unsupported: { label: 'Non supporté', variant: 'destructive' },
  unavailable: { label: 'Indisponible', variant: 'outline' },
}

export function PwaSettingsPanel() {
  const { toast } = useToast()
  const { status, isStandalone, updateAvailable, registration, promptInstall, updateApp, checkForUpdates, clearCache } = usePwa()
  const [clearing, setClearing] = useState(false)

  const handleClearCache = async () => {
    setClearing(true)
    const ok = await clearCache()
    setClearing(false)
    if (ok) {
      toast({ title: 'Succès', description: 'Cache de l\'application vidé' })
    } else {
      toast({ title: 'Erreur', description: 'Impossible de vider le cache', variant: 'destructive' })
    }
  }

  const handleUpdate = async () => {
    await updateApp()
    toast({ title: 'Mise à jour', description: 'Application mise à jour, rechargement...' })
  }

  const info = STATUS_LABELS[status] ?? STATUS_LABELS.unavailable
  const swVersion = registration?.active?.scriptURL ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Application (PWA)
        </CardTitle>
        <CardDescription>
          Installez Dhayaro sur votre appareil et gérez le cache hors ligne
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">État de l&apos;installation</p>
            <p className="text-xs text-muted-foreground">
              {isStandalone ? 'L\'application est lancée en mode autonome' : 'L\'application s\'affiche dans le navigateur'}
            </p>
          </div>
          <Badge variant={info.variant}>{info.label}</Badge>
        </div>

        {status === 'installable' && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Download className="h-5 w-5 text-primary" />
            <p className="flex-1 text-sm text-muted-foreground">
              Dhayaro est prête à être installée sur cet appareil. L&apos;installation ajoute une icône et permet
              l&apos;utilisation hors ligne.
            </p>
            <Button onClick={() => promptInstall()}>
              <Download className="mr-1 h-4 w-4" /> Installer
            </Button>
          </div>
        )}

        {status === 'ios' && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
            <div className="flex-1 space-y-2 text-sm text-muted-foreground">
              <p>
                Sur iPhone/iPad, ouvrez le menu <span className="font-medium text-foreground">Partager</span> (icône de
                partage), puis sélectionnez{' '}
                <span className="font-medium text-foreground">Ajouter à l&apos;écran d&apos;accueil</span>.
              </p>
              <p className="flex items-center gap-1 text-xs">
                <Globe className="h-3.5 w-3.5" /> Après l&apos;ajout, Dhayaro apparaîtra comme une application à part
                entière.
              </p>
            </div>
          </div>
        )}

        {status === 'unsupported' && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p>Ce navigateur ne prend pas en charge l&apos;installation d&apos;applications web. Utilisez un navigateur récent.</p>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Service worker</p>
            <p className="text-xs text-muted-foreground">
              {swVersion ? `Version enregistrée : ${swVersion.split('/').pop()}` : 'Service worker non enregistré'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={checkForUpdates}>
              <RefreshCw className="mr-1 h-4 w-4" /> Vérifier les mises à jour
            </Button>
            {updateAvailable && (
              <Button size="sm" onClick={handleUpdate}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mettre à jour maintenant
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={clearing} onClick={handleClearCache}>
              <Trash2 className="mr-1 h-4 w-4" /> {clearing ? 'Vidage...' : 'Vider le cache'}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p>
            Le mode hors ligne met en cache les données consultées récemment (consultations, traitements, patients). La
            synchronisation reprend automatiquement au retour de la connexion.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
