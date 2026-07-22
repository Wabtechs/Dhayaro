'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Stethoscope,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  UserCog,
  Award,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { useDoctorDetail, useUpdateDoctor, useDeleteDoctor, useFacilitiesData } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  DOCTOR: 'Médecin Généraliste',
  SPECIALIST: 'Médecin Spécialiste',
}
const roleBadgeColors: Record<string, string> = {
  DOCTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  SPECIALIST: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}
const ROLE_MAP: Record<string, string> = { doctor: 'DOCTOR', specialist: 'SPECIALIST' }

interface DoctorDetail {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email: string
  role: string
  phone?: string
  specialty?: string
  licenseNumber?: string
  availability?: string
  facilityId?: string
  facilityName?: string
  facilityType?: string
  isActive?: boolean
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()
  const { data, isLoading, error } = useDoctorDetail(id)
  const updateDoctor = useUpdateDoctor()
  const deleteDoctor = useDeleteDoctor()
  const { data: facilitiesData } = useFacilitiesData()
  const { toast } = useToast()

  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('doctor')
  const [facility, setFacility] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [availability, setAvailability] = useState('')

  const d = data as DoctorDetail | null | undefined
  const facilitiesList = (facilitiesData?.items ?? []) as { id: string; name: string }[]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement du médecin...</p>
      </div>
    )
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Médecin non trouvé</h2>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/doctors')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    )
  }

  const doctorId = d.id || id
  const fullName = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email
  const isActive = d.isActive !== false
  const roleColor = roleBadgeColors[d.role] || 'bg-gray-100 text-gray-800'
  const roleLabel = roleLabels[d.role] || d.role

  const openEdit = () => {
    setFirstName(d.firstName || '')
    setLastName(d.lastName || '')
    setEmail(d.email)
    setRole((d.role || 'DOCTOR').toLowerCase())
    setFacility(d.facilityId || '')
    setPhone(d.phone || '')
    setSpecialty((d.specialty as string) || '')
    setLicenseNumber((d.licenseNumber as string) || '')
    setAvailability((d.availability as string) || 'AVAILABLE')
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoctor.mutateAsync({
        id: doctorId,
        data: {
          firstname: firstName,
          lastname: lastName,
          email,
          role: ROLE_MAP[role] || 'DOCTOR',
          facilityId: facility || null,
          phone: phone || undefined,
          specialty: specialty || null,
          licenseNumber: licenseNumber || null,
          availability: availability || null,
        },
      })
      toast({ title: 'Médecin mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le médecin.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer le médecin "${fullName}" ?`,
      callback: async () => {
        try {
          await deleteDoctor.mutateAsync(doctorId)
          toast({ title: 'Médecin supprimé', description: `${fullName} a été retiré.` })
          router.push('/doctors')
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer le médecin.', variant: 'destructive' })
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.push('/doctors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Stethoscope className="h-5 w-5 text-primary" />
              {fullName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleColor}`}>{roleLabel}</span>
              <Badge className={isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300'}>
                {isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('users:edit') && (
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </Button>
          )}
          {can('users:delete') && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCog className="h-4 w-4" /> Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{d.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium text-foreground">{d.phone || '—'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Spécialité</p>
                  <p className="text-sm font-medium text-foreground">{d.specialty || '—'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">N° d'ordre</p>
                  <p className="text-sm font-medium text-foreground">{d.licenseNumber || '—'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Disponibilité</p>
                  <Badge className={
                    d.availability === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    d.availability === 'BUSY' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    d.availability === 'OFF_DUTY' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
                  }>
                    {d.availability === 'AVAILABLE' ? 'Disponible' :
                     d.availability === 'BUSY' ? 'Occupé' :
                     d.availability === 'OFF_DUTY' ? 'Hors service' :
                     d.availability || '—'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Établissement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Établissement</p>
                  <p className="text-sm font-medium text-foreground">{d.facilityName || '—'}</p>
                </div>
              </div>
              {d.facilityType && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium text-foreground">{d.facilityType}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="text-sm text-foreground">{formatDate(d.createdAt || '')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Dernière connexion</p>
                  <p className="text-sm text-foreground">{d.lastLogin ? formatDate(d.lastLogin) : 'Jamais'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleColor}`}>{roleLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Modifier le Médecin</DialogTitle>
            <DialogDescription>Modifiez les informations du médecin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="e-firstname">Prénom</Label>
                <Input id="e-firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-lastname">Nom</Label>
                <Input id="e-lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Médecin Généraliste</SelectItem>
                    <SelectItem value="specialist">Médecin Spécialiste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243 ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Spécialité</Label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Médecine générale" />
            </div>
            <div className="space-y-2">
              <Label>N° d'ordre</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Ex: ORD-1234" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Disponibilité</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="BUSY">Occupé</SelectItem>
                <SelectItem value="OFF_DUTY">Hors service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Établissement</Label>
              <Select value={facility} onValueChange={setFacility}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un établissement" /></SelectTrigger>
                <SelectContent>
                  {facilitiesList.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDelete?.callback(); setConfirmDelete(null) }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
