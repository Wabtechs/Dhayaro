'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Plus, UserRound, Calendar, Phone, MapPin, Pencil, Trash2 } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { usePatientsData, useFacilitiesData, useUpdatePatient, useDeletePatient } from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { api } from '@/services/api'
import { cn, formatDate } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'

const ITEMS_PER_PAGE = 10

interface PatientItem {
  id: string
  firstName?: string
  lastName?: string
  dateOfBirth: string
  gender?: string
  phone?: string
  address?: string
  bloodType?: string
  facilityId?: string
  medicalRecordNumber?: string
  allergies?: string[]
  isActive?: boolean
  lastVisit?: string
  [key: string]: unknown
}

interface FacilityItem {
  id: string
  name: string
  [key: string]: unknown
}

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

export default function PatientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [facilityFilter, setFacilityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const updatePatient = useUpdatePatient()
  const deletePatient = useDeletePatient()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'M' | 'F' | '',
    phone: '',
    address: '',
    bloodType: '',
    facilityId: '',
    allergies: '',
  })

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'M' | 'F' | '',
    phone: '',
    address: '',
    bloodType: '',
    facilityId: '',
    allergies: '',
  })

  const { data, isLoading } = usePatientsData()
  const { data: facilitiesData } = useFacilitiesData()
  const patients = (data?.items ?? []) as PatientItem[]
  const facilitiesList = (facilitiesData?.items ?? []) as FacilityItem[]

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase()
      const matchesSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        (p.medicalRecordNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.phone || '').includes(search)
      const matchesGender =
        genderFilter === 'all' || p.gender === genderFilter
      const matchesFacility =
        facilityFilter === 'all' || p.facilityId === facilityFilter
      return matchesSearch && matchesGender && matchesFacility
    })
  }, [patients, search, genderFilter, facilityFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const getFacilityName = (id: string) =>
    facilitiesList.find((f) => f.id === id)?.name ?? '—'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/patients', {
        firstname: form.firstName,
        lastname: form.lastName,
        dateOfBirth: form.dateOfBirth,
        sex: form.gender,
        phone: form.phone,
        address: form.address,
        bloodGroup: form.bloodType,
        facilityId: sanitizeUuid(form.facilityId),
        allergies: form.allergies ? form.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
      }, token)
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast({ title: 'Patient créé', description: `${form.firstName} ${form.lastName} a été ajouté.` })
      setDialogOpen(false)
      setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', phone: '', address: '', bloodType: '', facilityId: '', allergies: '' })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer le patient.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (patient: PatientItem) => {
    setEditingPatient(patient)
    setEditForm({
      firstName: (patient.firstName as string) || '',
      lastName: (patient.lastName as string) || '',
      dateOfBirth: (patient.dateOfBirth as string) || '',
      gender: ((patient.gender as string) || '') as 'M' | 'F' | '',
      phone: (patient.phone as string) || '',
      address: (patient.address as string) || '',
      bloodType: (patient.bloodType as string) || '',
      facilityId: (patient.facilityId as string) || '',
      allergies: Array.isArray(patient.allergies) ? (patient.allergies as string[]).join(', ') : '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPatient) return
    setSaving(true)
    try {
      await updatePatient.mutateAsync({
        id: editingPatient.id as string,
        data: {
          firstname: editForm.firstName,
          lastname: editForm.lastName,
          dateOfBirth: editForm.dateOfBirth,
          sex: editForm.gender,
          phone: editForm.phone,
          address: editForm.address,
          bloodGroup: editForm.bloodType,
          facilityId: sanitizeUuid(editForm.facilityId),
          allergies: editForm.allergies ? editForm.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
        },
      })
      toast({ title: 'Patient mis à jour', description: `${editForm.firstName} ${editForm.lastName} a été modifié.` })
      setEditDialogOpen(false)
      setEditingPatient(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier le patient.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (patient: PatientItem) => {
    const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le patient "${name}" ? Cette action est irréversible.`)) return
    try {
      await deletePatient.mutateAsync(patient.id as string)
      toast({ title: 'Patient supprimé', description: `${name} a été supprimé.` })
    } catch {
      toast({ title: 'Erreur', description: "Impossible de supprimer le patient.", variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Chargement des patients...</p>
        </div>
      ) : (
      <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Patients</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} patient{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('patients:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Patient
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau Patient</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un nouveau dossier patient.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom</label>
                  <Input
                    placeholder="Prénom"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input
                    placeholder="Nom"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de Naissance</label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sexe</label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as 'M' | 'F' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    placeholder="+213 ..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Groupe Sanguin</label>
                  <Select
                    value={form.bloodType}
                    onValueChange={(v) => setForm({ ...form, bloodType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input
                  placeholder="Adresse complète"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Établissement</label>
                <Select
                  value={form.facilityId}
                  onValueChange={(v) => setForm({ ...form, facilityId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilitiesList.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <Input
                  placeholder="Séparées par des virgules (ex: Pénicilline, Arachides)"
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>{creating ? 'Création...' : 'Créer le Patient'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier le Patient</DialogTitle>
              <DialogDescription>
                Modifiez les informations du patient.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom</label>
                  <Input
                    placeholder="Prénom"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input
                    placeholder="Nom"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de Naissance</label>
                  <Input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sexe</label>
                  <Select
                    value={editForm.gender}
                    onValueChange={(v) => setEditForm({ ...editForm, gender: v as 'M' | 'F' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    placeholder="+213 ..."
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Groupe Sanguin</label>
                  <Select
                    value={editForm.bloodType}
                    onValueChange={(v) => setEditForm({ ...editForm, bloodType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input
                  placeholder="Adresse complète"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Établissement</label>
                <Select
                  value={editForm.facilityId}
                  onValueChange={(v) => setEditForm({ ...editForm, facilityId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilitiesList.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <Input
                  placeholder="Séparées par des virgules (ex: Pénicilline, Arachides)"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, N° dossier ou téléphone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={genderFilter}
          onValueChange={(v) => {
            setGenderFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sexe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="M">Masculin</SelectItem>
            <SelectItem value="F">Féminin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={facilityFilter}
          onValueChange={(v) => {
            setFacilityFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Établissement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les établissements</SelectItem>
            {facilitiesList.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom Complet</TableHead>
                <TableHead>N° Dossier</TableHead>
                <TableHead>Date de Naissance</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Groupe Sanguin</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Dernière Visite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <button
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      className="flex items-center gap-3 font-medium text-foreground hover:underline"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {(patient.firstName || '?')[0]}
                          {(patient.lastName || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      {patient.firstName || '—'} {patient.lastName || ''}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {patient.medicalRecordNumber || '—'}
                  </TableCell>
                  <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {patient.gender || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('font-mono', bloodTypeColors[patient.bloodType || ''])}
                    >
                      {patient.bloodType || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{patient.phone || '—'}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">
                    {getFacilityName(patient.facilityId)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {patient.lastVisit ? formatDate(patient.lastVisit) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={patient.isActive ? 'default' : 'secondary'}
                      className={cn(
                        patient.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {patient.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {can('patients:edit') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(patient)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      )}
                      {can('patients:delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(patient)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/patients/${patient.id}`)}
                      >
                        Détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Aucun patient trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {paginated.map((patient) => (
          <Card key={patient.id}>
            <CardContent className="p-4">
              <button
                onClick={() => router.push(`/patients/${patient.id}`)}
                className="flex w-full items-start gap-3 text-left"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs">
                    {(patient.firstName || '?')[0]}
                    {(patient.lastName || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {patient.firstName || '—'} {patient.lastName || ''}
                    </p>
                    <Badge
                      variant={patient.isActive ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        patient.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {patient.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {patient.medicalRecordNumber || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UserRound className="h-3 w-3" />
                      {patient.gender === 'M' ? 'Masculin' : patient.gender === 'F' ? 'Féminin' : patient.gender || '—'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('font-mono text-xs', bloodTypeColors[patient.bloodType || ''])}
                    >
                      {patient.bloodType || '—'}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.phone || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getFacilityName(patient.facilityId)}
                    </span>
                    {patient.lastVisit && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(patient.lastVisit)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        ))}
        {paginated.length === 0 && (
          <Card>
            <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
              Aucun patient trouvé.
            </CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
