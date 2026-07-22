'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Users,
  Bed,
  Stethoscope,
  AlertCircle,
  Loader2,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  useFacilityDetail,
  useClinicalCasesData,
  usePatientsData,
  useUsersData,
  useUpdateFacility,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getStatusLabel, getStatusColor, getRoleLabel } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  hospital: 'Hôpital',
  clinic: 'Clinique',
  center: 'Centre',
  polyclinic: 'Polyclinique',
  other: 'Autre',
}

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: facility, isLoading, error } = useFacilityDetail(id)
  const { data: allCasesData } = useClinicalCasesData(id)
  const { data: allPatientsData } = usePatientsData(id)
  const { data: allUsersData } = useUsersData(id)

  const [selectedTab, setSelectedTab] = useState('overview')
  const updateFacility = useUpdateFacility()
  const { toast } = useToast()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', type: '', address: '', city: '', phone: '', email: '', bedCount: '',
  })

  const f = facility as Record<string, unknown> | null | undefined

  const openEditDialog = () => {
    if (!f) return
    setEditForm({
      name: (f.name as string) || '',
      type: (f.type as string) || 'hospital',
      address: (f.address as string) || '',
      city: (f.city as string) || '',
      phone: (f.phone as string) || '',
      email: (f.email as string) || '',
      bedCount: String((f.capacity as number) || ''),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateFacility.mutateAsync({
        id: f!.id as string,
        data: {
          name: editForm.name,
          type: editForm.type,
          address: editForm.address,
          city: editForm.city,
          phone: editForm.phone,
          email: editForm.email,
          capacity: editForm.bedCount ? Number(editForm.bedCount) : undefined,
        },
      })
      toast({ title: 'Établissement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'établissement.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const facilityCases = ((allCasesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const facilityPatients = ((allPatientsData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const facilityUsers = ((allUsersData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de l&apos;établissement...</p>
      </div>
    )
  }

  if (error || !f) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Établissement non trouvé
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;établissement demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/facilities')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const facilityType = (f.type as string) || 'hospital'
  const facilityStatus = (f.status as string) || 'active'

  const activeCases = facilityCases.filter((c) => c.status === 'active').length
  const activePatients = facilityPatients.filter((p) => p.status === 'active' || p.isActive).length
  const totalUsers = facilityUsers.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/facilities')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {(f.name as string) || 'Sans nom'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={facilityStatus === 'active' ? 'default' : 'secondary'}>
                {facilityStatus === 'active' ? 'Actif' : facilityStatus}
              </Badge>
              <Badge variant="outline">
                {typeLabels[facilityType] || facilityType}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="cases">
                Cas ({facilityCases.length})
              </TabsTrigger>
              <TabsTrigger value="patients">
                Patients ({facilityPatients.length})
              </TabsTrigger>
              <TabsTrigger value="staff">
                Personnel ({facilityUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {(f.description as string) || 'Aucune description disponible.'}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium text-foreground">{typeLabels[facilityType] || facilityType}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Capacité</p>
                      <p className="text-sm font-medium text-foreground">{(f.capacity as number) || 'Non renseigné'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {((f.services as string[]) || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun service renseigné.</p>
                    ) : (
                      ((f.services as string[]) || []).map((service) => (
                        <Badge key={service} variant="outline">
                          <Stethoscope className="mr-1 h-3 w-3" />
                          {service}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cases" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cas cliniques ({facilityCases.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {facilityCases.length === 0 ? (
                    <div className="py-8 text-center">
                      <Stethoscope className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Aucun cas clinique dans cet établissement.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Créé le</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facilityCases.map((c) => (
                            <TableRow key={c.id as string}>
                              <TableCell>
                                <Link
                                  href={`/clinical-cases/${c.id}`}
                                  className="font-medium text-foreground hover:underline"
                                >
                                  {(c.title as string) || (c.diagnosis as string) || 'Sans titre'}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(c.status as string)}>
                                  {getStatusLabel(c.status as string)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {((c.priority as string) || 'medium').charAt(0).toUpperCase() + ((c.priority as string) || 'medium').slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(c.createdAt as string)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patients ({facilityPatients.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {facilityPatients.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Aucun patient dans cet établissement.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Inscrit le</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facilityPatients.map((p) => (
                            <TableRow key={p.id as string}>
                              <TableCell>
                                <Link
                                  href={`/patients/${p.id}`}
                                  className="font-medium text-foreground hover:underline"
                                >
                                  {(p.firstName as string) || ''} {(p.lastName as string) || ''}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(p.status as string)}>
                                  {getStatusLabel(p.status as string)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(p.createdAt as string)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personnel ({facilityUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {facilityUsers.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Aucun membre du personnel dans cet établissement.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facilityUsers.map((u) => (
                            <TableRow key={u.id as string}>
                              <TableCell className="font-medium text-foreground">
                                {(u.firstName as string) || ''} {(u.lastName as string) || ''}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getRoleLabel(u.role as string)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {(u.email as string) || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cas actifs</p>
                  <p className="text-sm font-medium text-foreground">{activeCases}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Patients actifs</p>
                  <p className="text-sm font-medium text-foreground">{activePatients}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Personnel</p>
                  <p className="text-sm font-medium text-foreground">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(f.phone as string) && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{f.phone as string}</span>
                </div>
              )}
              {(f.email as string) && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{f.email as string}</span>
                </div>
              )}
              {(f.website as string) && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{f.website as string}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adresse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">
                    {(f.address as string) || 'Non renseignée'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(f.city as string) || ''} {(f.wilaya as string) || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(f.createdAt as string) && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Inscrit le</p>
                  <p className="text-sm text-foreground">{formatDate(f.createdAt as string)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'établissement</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'établissement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedCount">Capacité (lits)</Label>
              <Input id="bedCount" type="number" min="0" value={editForm.bedCount} onChange={(e) => setEditForm({ ...editForm, bedCount: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
