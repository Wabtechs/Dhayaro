'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Mail,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Stethoscope,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  useDoctorsData,
  useFacilitiesData,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
} from '@/hooks/use-data'
import { sanitizeUuid } from '@/lib/validation'
import { usePermissions } from '@/hooks/use-permissions'
import { getInitials } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 10

interface DoctorItem {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email: string
  role: string
  phone?: string
  facilityId?: string
  facilityName?: string
  isActive?: boolean
  lastLogin?: string
  createdAt?: string
  [key: string]: unknown
}

const roleLabels: Record<string, string> = {
  DOCTOR: 'Médecin Généraliste',
  SPECIALIST: 'Médecin Spécialiste',
}

const roleBadgeColors: Record<string, string> = {
  DOCTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  SPECIALIST: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}

const ROLE_MAP: Record<string, string> = {
  doctor: 'DOCTOR',
  specialist: 'SPECIALIST',
}

export default function DoctorsView() {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('DOCTOR')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<DoctorItem | null>(null)
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorItem | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('doctor')
  const [facility, setFacility] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [availability, setAvailability] = useState('AVAILABLE')

  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<string>('doctor')
  const [editFacility, setEditFacility] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [editLicenseNumber, setEditLicenseNumber] = useState('')
  const [editAvailability, setEditAvailability] = useState('AVAILABLE')

  const params = `role=${roleFilter}&page=${page}&size=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ''}`
  const { data, isLoading } = useDoctorsData(params)
  const { data: facilitiesData } = useFacilitiesData()
  const createDoctor = useCreateDoctor()
  const updateDoctor = useUpdateDoctor()
  const deleteDoctor = useDeleteDoctor()

  const items = (data?.items ?? []) as DoctorItem[]
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const facilitiesList = (facilitiesData?.items ?? []) as { id: string; name: string }[]

  const resetCreateForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setRole('doctor')
    setFacility('')
    setPhone('')
    setSpecialty('')
    setLicenseNumber('')
    setAvailability('AVAILABLE')
  }

  const openEdit = (doc: DoctorItem) => {
    setEditingDoctor(doc)
    setEditFirstName(doc.firstName || '')
    setEditLastName(doc.lastName || '')
    setEditEmail(doc.email)
    setEditRole((doc.role || 'DOCTOR').toLowerCase())
    setEditFacility(doc.facilityId || '')
    setEditPhone(doc.phone || '')
    setEditSpecialty((doc.specialty as string) || '')
    setEditLicenseNumber((doc.licenseNumber as string) || '')
    setEditAvailability((doc.availability as string) || 'AVAILABLE')
    setEditOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createDoctor.mutateAsync({
        firstname: firstName,
        lastname: lastName,
        email,
        password,
        role: ROLE_MAP[role] || 'DOCTOR',
        facilityId: sanitizeUuid(facility),
        phone: phone || undefined,
        specialty: specialty || null,
        licenseNumber: licenseNumber || null,
        availability: availability || null,
      })
      toast({ title: 'Médecin créé', description: `${firstName} ${lastName} a été ajouté.` })
      setCreateOpen(false)
      resetCreateForm()
      setPage(1)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le médecin.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoctor) return
    setSaving(true)
    try {
      await updateDoctor.mutateAsync({
        id: editingDoctor.id,
        data: {
          firstname: editFirstName,
          lastname: editLastName,
          email: editEmail,
          role: ROLE_MAP[editRole] || 'DOCTOR',
          facilityId: sanitizeUuid(editFacility),
          phone: editPhone || undefined,
          specialty: editSpecialty || null,
          licenseNumber: editLicenseNumber || null,
          availability: editAvailability || null,
        },
      })
      toast({ title: 'Médecin mis à jour', description: `${editFirstName} ${editLastName} a été modifié.` })
      setEditOpen(false)
      setEditingDoctor(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le médecin.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingDoctor) return
    setDeleting(true)
    try {
      await deleteDoctor.mutateAsync(deletingDoctor.id)
      toast({ title: 'Médecin supprimé', description: `${deletingDoctor.name || deletingDoctor.email} a été retiré.` })
      setDeleteOpen(false)
      setDeletingDoctor(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le médecin.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Stethoscope className="h-6 w-6 text-primary" />
            Médecins
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les médecins et spécialistes de l&apos;établissement
          </p>
        </div>
        {can('users:create') && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Nouveau Médecin</DialogTitle>
                <DialogDescription>
                  Ajoutez un médecin ou spécialiste à la plateforme.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">Prénom</Label>
                    <Input id="firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Nom</Label>
                    <Input id="lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Création...' : 'Créer'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DOCTOR">Médecins Généralistes</SelectItem>
            <SelectItem value="SPECIALIST">Médecins Spécialistes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Stethoscope className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun médecin</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun médecin ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Médecin</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/doctors/${doc.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`)}
                      </div>
                      <div>
                        <p className="font-medium">{doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`}</p>
                        {doc.facilityName && (
                          <p className="text-xs text-muted-foreground">{doc.facilityName}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {doc.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {doc.phone || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {doc.facilityName || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadgeColors[doc.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {roleLabels[doc.role] || doc.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.isActive ? 'active' : 'secondary'}>
                      {doc.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {can('users:edit') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {can('users:delete') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { setDeletingDoctor(doc); setDeleteOpen(true) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} médecin{total > 1 ? 's' : ''} au total
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
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
                <Label htmlFor="edit-firstname">Prénom</Label>
                <Input id="edit-firstname" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastname">Nom</Label>
                <Input id="edit-lastname" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Médecin Généraliste</SelectItem>
                    <SelectItem value="specialist">Médecin Spécialiste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+243 ..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Spécialité</Label>
                      <Input value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} placeholder="Ex: Médecine générale" />
                    </div>
                    <div className="space-y-2">
                      <Label>N° d'ordre</Label>
                      <Input value={editLicenseNumber} onChange={(e) => setEditLicenseNumber(e.target.value)} placeholder="Ex: ORD-1234" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilité</Label>
                    <Select value={editAvailability} onValueChange={setEditAvailability}>
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
              <Select value={editFacility} onValueChange={setEditFacility}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un établissement" /></SelectTrigger>
                <SelectContent>
                  {facilitiesList.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Supprimer le médecin</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-medium">{deletingDoctor?.name || deletingDoctor?.email}</span> ? Cette action est réversible (désactivation).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
