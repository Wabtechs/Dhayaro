'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, UserRound, Calendar, Phone, MapPin, Mail, Heart, FileText, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { usePermissions } from '@/hooks/use-permissions'
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
  usePatientDetail,
  useClinicalCasesData,
  useUsersData,
  useFacilitiesData,
  useUpdatePatient,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate } from '@/lib/utils'
import { patientSchema, type PatientValues, toPatientPayload, commaJoin } from '@/lib/schemas'
import type { CaseStatus, CasePriority } from '@/types'

const bloodTypeColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-800 border-red-200',
  'A-': 'bg-red-50 text-red-700 border-red-200',
  'B+': 'bg-blue-100 text-blue-800 border-blue-200',
  'B-': 'bg-blue-50 text-blue-700 border-blue-200',
  'AB+': 'bg-purple-100 text-purple-800 border-purple-200',
  'AB-': 'bg-purple-50 text-purple-700 border-purple-200',
  'O+': 'bg-green-100 text-green-800 border-green-200',
  'O-': 'bg-green-50 text-green-700 border-green-200',
}

const statusLabels: Record<CaseStatus, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En revue',
  resolved: 'Résolu',
  archived: 'Archivé',
}

const statusColors: Record<CaseStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  archived: 'bg-purple-100 text-purple-800',
}

const priorityLabels: Record<CasePriority, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
}

const priorityColors: Record<CasePriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: patient, isLoading, error } = usePatientDetail(id)
  const { data: casesData } = useClinicalCasesData()
  const { data: usersData } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()
  const updatePatient = useUpdatePatient()
  const { toast } = useToast()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const editForm = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '' as PatientValues['gender'],
      phone: '',
      address: '',
      bloodType: '',
      facilityId: '',
      allergies: '',
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-28" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserRound className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Patient non trouvé</h1>
        <p className="text-muted-foreground">
          Le patient demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button asChild>
          <Link href="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    )
  }

  const p = patient as Record<string, unknown>
  const firstName = (p.firstName as string) || ''
  const lastName = (p.lastName as string) || ''
  const gender = (p.gender as string) || (p.sex as string) || ''
  const bloodType = (p.bloodType as string) || (p.bloodGroup as string) || ''
  const phone = (p.phone as string) || '—'
  const email = (p.email as string) || ''
  const address = (p.address as string) || '—'
  const dateOfBirth = (p.dateOfBirth as string) || ''
  const medicalRecordNumber = (p.medicalRecordNumber as string) || (p.patientUuid as string) || ''
  const isActive = p.isActive !== false
  const facilityId = (p.facilityId as string) || ''
  const allergies = (p.allergies as string[]) || []
  const createdAt = (p.createdAt as string) || ''
  const patientId = (p.id as string) || id

  const facilitiesList = ((facilitiesData as { items?: Array<{ id: string; name: string }> })?.items ?? []) as Array<{ id: string; name: string }>

  const openEditDialog = () => {
    editForm.reset({
      firstName, lastName, dateOfBirth,
      gender: gender.toUpperCase() as PatientValues['gender'],
      phone: phone === '—' ? '' : phone, address: address === '—' ? '' : address,
      bloodType: bloodType as PatientValues['bloodType'], facilityId, allergies: commaJoin(allergies),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = editForm.handleSubmit(async (values) => {
    setSaving(true)
    try {
      await updatePatient.mutateAsync({
        id: patientId,
        data: toPatientPayload(values),
      })
      toast({ title: 'Patient mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le patient.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const facilityMap = (facilitiesData as { items?: Array<{ id: string; name: string }> })?.items
    ? Object.fromEntries((facilitiesData as { items: Array<{ id: string; name: string }> }).items.map((f) => [f.id, f.name]))
    : {}
  const facilityName = facilityMap[facilityId] || '—'

  const userMap = (usersData as { items?: Array<{ id: string; firstName?: string; lastName?: string; name?: string }> })?.items
    ? Object.fromEntries((usersData as { items: Array<{ id: string; firstName?: string; lastName?: string; name?: string }> }).items.map((u) => [u.id, u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—']))
    : {}

  const allCases = ((casesData as unknown as { items?: Array<Record<string, unknown>> })?.items || []) as Record<string, unknown>[]
  const cases = allCases.filter((c) => c.patientId === patientId || c.patient_id === patientId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/patients')} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        {can('patients:edit') && (
        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-2xl">
            {(firstName || '?')[0]}{(lastName || '?')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {firstName} {lastName}
            </h1>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={cn(
                isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
              )}
            >
              {isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {medicalRecordNumber}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date de Naissance</p>
                  <p className="text-sm font-medium">{formatDate(dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sexe</p>
                  <p className="text-sm font-medium">
                    {gender === 'M' ? 'Masculin' : gender === 'F' ? 'Féminin' : gender || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Groupe Sanguin</p>
                  {bloodType ? (
                    <Badge
                      variant="outline"
                      className={cn('font-mono', bloodTypeColors[bloodType])}
                    >
                      {bloodType}
                    </Badge>
                  ) : (
                    <p className="text-sm font-medium">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{phone}</p>
                </div>
              </div>
              {email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 sm:col-span-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="text-sm font-medium">{address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations Médicales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {allergies.length > 0 ? (
                  allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive" className="font-normal">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune allergie connue</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Établissement</p>
                <p className="text-sm font-medium">{facilityName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date de Création</p>
                <p className="text-sm font-medium">{formatDate(createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">N° Dossier</p>
                <p className="font-mono text-sm font-medium">{medicalRecordNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases" className="gap-2">
            <FileText className="h-4 w-4" />
            Cas Cliniques
            <Badge variant="secondary" className="ml-1 text-xs">
              {cases.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead className="hidden sm:table-cell">Date de Création</TableHead>
                    <TableHead className="hidden md:table-cell">Médecin Assigné</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.length > 0 ? (
                    cases.map((c) => {
                      const caseStatus = (c.status as CaseStatus) || 'active'
                      const casePriority = (c.priority as CasePriority) || 'medium'
                      const doctorId = (c.assignedDoctorId as string) || (c.doctorId as string) || ''
                      return (
                        <TableRow
                          key={c.id as string}
                          className="cursor-pointer"
                          onClick={() => router.push(`/clinical-cases/${c.id}`)}
                        >
                          <TableCell className="font-medium">{(c.title as string) || '—'}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('font-normal', statusColors[caseStatus])}
                            >
                              {statusLabels[caseStatus] || caseStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('font-normal', priorityColors[casePriority])}
                            >
                              {priorityLabels[casePriority] || casePriority}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                            {formatDate(c.createdAt as string)}
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {userMap[doctorId] || '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun cas clinique pour ce patient.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le patient</DialogTitle>
            <DialogDescription>
              Modifiez les informations du patient ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" {...editForm.register('firstName')} />
                {editForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" {...editForm.register('lastName')} />
                {editForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input id="dateOfBirth" type="date" {...editForm.register('dateOfBirth')} />
                {editForm.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sexe</Label>
                <Controller
                  name="gender"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {editForm.formState.errors.gender && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.gender.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...editForm.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...editForm.register('address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Groupe sanguin</Label>
                <Controller
                  name="bloodType"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="bloodType">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {editForm.formState.errors.bloodType && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.bloodType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityId">Établissement</Label>
                <Controller
                  name="facilityId"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger id="facilityId">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilitiesList.map((fac) => (
                          <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {editForm.formState.errors.facilityId && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.facilityId.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (séparées par des virgules)</Label>
              <Input id="allergies" {...editForm.register('allergies')} placeholder="Ex: Pénicilline, Arachides" />
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
