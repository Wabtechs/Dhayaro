'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notificationPreferenceCreateSchema, type NotificationPreferenceCreateValues } from '@/lib/schemas'
import { Search, Plus, Bell, Settings, Volume2, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotificationPreferencesData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'

interface NotificationPreferenceItem {
  id: string
  userId: string
  soundEnabled: boolean
  volume: number
  notificationTypes: string[]
  services: string[]
  isActive: boolean
  userFirstname?: string
  userLastname?: string
  userEmail?: string
  createdAt: string
  updatedAt: string
}

const serviceLabels: Record<string, string> = {
  LABORATORY: 'Laboratoire',
  PHARMACY: 'Pharmacie',
  IMAGERY: 'Imagerie',
  HOSPITALIZATION: 'Hospitalisation',
  RECEPTION: 'Réception',
  ADMINISTRATION: 'Administration',
}

const notificationTypeLabels: Record<string, string> = {
  INFO: 'Information',
  WARNING: 'Avertissement',
  SUCCESS: 'Succès',
  ERROR: 'Erreur',
}

export default function NotificationPreferencesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createForm = useForm<NotificationPreferenceCreateValues>({
    resolver: zodResolver(notificationPreferenceCreateSchema),
    defaultValues: { soundEnabled: true, volume: 50, notificationTypes: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'], services: ['LABORATORY', 'PHARMACY', 'IMAGERY', 'HOSPITALIZATION', 'RECEPTION', 'ADMINISTRATION'] },
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('page', String(page))
  params.set('size', '10')
  const paramsStr = params.toString()

  const { data, isLoading } = useNotificationPreferencesData(paramsStr)
  const items = (data?.items ?? []) as NotificationPreferenceItem[]
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 10)

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      const res = await fetch(`/api/v1/notification-preferences/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        toast({ title: 'Succès', description: 'Préférences supprimées' })
        setDeletingId(null)
      } else {
        const err = await res.json()
        toast({ title: 'Erreur', description: err.message || 'Impossible de supprimer', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer les préférences', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Préférences de notification</h1>
          <p className="text-muted-foreground">Configuration des alertes et notifications</p>
        </div>
        {can('notifications:manage') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle préférence
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Son</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Types</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune préférence trouvée
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        {item.userFirstname} {item.userLastname}
                        <span className="text-xs text-muted-foreground">({item.userEmail})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.soundEnabled ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30">Activé</Badge>
                      ) : (
                        <Badge variant="outline">Désactivé</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3 text-muted-foreground" />
                        {item.volume}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.notificationTypes || []).map((type) => (
                          <Badge key={type} variant="outline" className="text-[10px]">{notificationTypeLabels[type] || type}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.services || []).map((service) => (
                          <Badge key={service} variant="outline" className="text-[10px]">{serviceLabels[service] || service}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'outline'} className={item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : ''}>
                        {item.isActive ? 'Oui' : 'Non'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/notification-preferences/${item.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(item.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} préférence(s)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle préférence de notification</DialogTitle>
            <DialogDescription>Configurer les préférences de notification pour un utilisateur</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(async (values) => {
            try {
              const token = localStorage.getItem('dhayaro_token') || ''
              const res = await fetch('/api/v1/notification-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(values),
              })
              if (res.ok) {
                toast({ title: 'Succès', description: 'Préférences créées' })
                setShowCreateDialog(false)
                createForm.reset()
              } else {
                const err = await res.json()
                toast({ title: 'Erreur', description: err.message || 'Impossible de créer', variant: 'destructive' })
              }
            } catch {
              toast({ title: 'Erreur', description: 'Impossible de créer les préférences', variant: 'destructive' })
            }
          })} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Utilisateur *</label>
              <Controller
                control={createForm.control}
                name="userId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un utilisateur" /></SelectTrigger>
                    <SelectContent>
                      {/* User list would be populated here */}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Controller
                  control={createForm.control}
                  name="soundEnabled"
                  render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
                  )}
                />
                <label className="text-sm">Son activé</label>
              </div>
              <div>
                <label className="text-sm font-medium">Volume</label>
                <Controller
                  control={createForm.control}
                  name="volume"
                  render={({ field }) => (
                    <Input type="number" min={0} max={100} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ces préférences de notification ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) handleDelete(deletingId) }} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}