'use client'

import { useState } from 'react'
import { useForm, Controller, type FieldError, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { userCreateSchema, userEditSchema, toUserPayload, USER_ROLES, type UserCreateValues, type UserEditValues } from '@/lib/schemas'
import {
  Search,
  Plus,
  Mail,
  Building2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
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
  DialogTrigger,
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
import { useUsersData, useFacilitiesData, useUpdateUser, useDeleteUser } from '@/hooks/use-data'
import { api } from '@/services/api'
import { formatDate, getInitials } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/types'

const MULTI_FACILITY_ROLES = new Set(['super_admin', 'admin'])

interface UserItem {
  id: string
  firstname?: string
  lastname?: string
  name?: string
  email: string
  role: string
  phone?: string
  avatar?: string
  facilityId?: string
  facilityName?: string
  isActive?: boolean
  lastLogin?: string
  createdAt?: string
  [key: string]: unknown
}

interface FacilityItem {
  id: string
  name: string
  [key: string]: unknown
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  receptionist: 'Réceptionniste',
  doctor: 'Médecin',
  specialist: 'Spécialiste',
  laboratory: 'Laborantin',
  pharmacist: 'Pharmacien',
  nurse: 'Infirmier',
  accountant: 'Comptable',
  archivist: 'Archiviste',
}

const CREATE_ROLE_OPTIONS: Array<(typeof USER_ROLES)[number]> = [
  'admin', 'doctor', 'nurse', 'receptionist', 'specialist',
  'laboratory', 'pharmacist', 'accountant', 'archivist',
]

const EDIT_ROLE_OPTIONS: Array<(typeof USER_ROLES)[number]> = [
  'super_admin', 'admin', 'receptionist', 'doctor', 'specialist',
  'laboratory', 'pharmacist', 'nurse', 'accountant', 'archivist',
]

function FormFieldError({ error }: { error: FieldError | FieldError[] | undefined }) {
  if (!error) return null
  const m = 'message' in error ? error.message : error[0]?.message
  if (!m) return null
  return <p className="text-xs text-destructive">{m}</p>
}

function getUserDisplayName(u: Record<string, unknown>): string {
  const first = (u.firstName || u.firstname || '') as string
  const last = (u.lastName || u.lastname || '') as string
  return `${first} ${last}`.trim() || (u.email as string) || '—'
}

const roleBadgeColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  receptionist: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  doctor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  specialist: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  laboratory: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  pharmacist: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  nurse: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  accountant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  archivist: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

type SortField = 'name' | 'email' | 'role' | 'facility' | 'lastLogin' | 'isActive'
type SortDirection = 'asc' | 'desc'

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: 'asc' | 'desc' }) {
  if (sortField !== field) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  )
}

export default function Users() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const { data: usersData, isLoading } = useUsersData(undefined, page, 10, search)
  const { data: facilitiesData } = useFacilitiesData()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const facilitiesList = (facilitiesData?.items ?? []) as FacilityItem[]

  const [newDepartment, setNewDepartment] = useState('')

  const createForm = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema) as Resolver<UserCreateValues>,
    defaultValues: { name: '', email: '', role: 'doctor', facility: '', phone: '', password: '' },
  })

  const editForm = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema) as Resolver<UserEditValues>,
    defaultValues: { name: '', email: '', role: 'doctor', facility: '', phone: '' },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const facilityMap = Object.fromEntries(facilitiesList.map((f) => [f.id, f.name]))

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const allUsers = ((usersData?.items ?? []) as UserItem[]).map((u) => ({
    ...u,
    role: (u.role || '').toLowerCase(),
  }))

  const items = allUsers.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesRole
  })

  items.sort((a, b) => {
    let aVal = ''
    let bVal = ''

    switch (sortField) {
      case 'name':
        aVal = a.name
        bVal = b.name
        break
      case 'email':
        aVal = a.email
        bVal = b.email
        break
      case 'role':
        aVal = a.role
        bVal = b.role
        break
      case 'facility':
        aVal = facilityMap[a.facilityId || ''] || ''
        bVal = facilityMap[b.facilityId || ''] || ''
        break
      case 'lastLogin':
        aVal = a.lastLogin || ''
        bVal = b.lastLogin || ''
        break
      case 'isActive':
        aVal = a.isActive ? '1' : '0'
        bVal = b.isActive ? '1' : '0'
        break
    }

    const cmp = aVal.localeCompare(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalCount = usersData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const onSubmitCreate = createForm.handleSubmit(async (values) => {
    setCreating(true)
    try {
      const token = localStorage.getItem('dhayaro_token') || ''
      await api.post('/users', toUserPayload(values, true), token)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Utilisateur créé', description: `${values.name} a été ajouté.` })
      setDialogOpen(false)
      createForm.reset()
      setNewDepartment('')
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'utilisateur.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  })

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      name: getUserDisplayName(user as unknown as Record<string, unknown>),
      email: user.email || '',
      role: user.role || 'doctor',
      facility: ((user as unknown as Record<string, unknown>).facilityId as string) || '',
      phone: user.phone || '',
    })
    setEditDialogOpen(true)
  }

  const onSubmitUpdate = editForm.handleSubmit(async (values) => {
    if (!editingUser) return
    setSaving(true)
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: toUserPayload(values, false) as Record<string, unknown>,
      })
      toast({ title: 'Utilisateur mis à jour', description: `${values.name} a été modifié.` })
      setEditDialogOpen(false)
      setEditingUser(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'utilisateur.", variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)
    try {
      await deleteUser.mutateAsync(deletingUser.id)
      toast({ title: 'Utilisateur supprimé', description: `${getUserDisplayName(deletingUser as unknown as Record<string, unknown>)} a été désactivé.` })
      setDeleteOpen(false)
      setDeletingUser(null)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'utilisateur.', variant: 'destructive' })
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
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
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
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les comptes utilisateurs de la plateforme
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {can('users:create') && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel Utilisateur
            </Button>
          </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvel Utilisateur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel utilisateur à la plateforme.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmitCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nom complet</Label>
                <Input
                  id="user-name"
                  {...createForm.register('name')}
                  placeholder="Dr. Jean Dupont"
                />
                <FormFieldError error={createForm.formState.errors.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  {...createForm.register('email')}
                  placeholder="jean.dupont@dhayaro.cd"
                />
                <FormFieldError error={createForm.formState.errors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Mot de passe</Label>
                <Input
                  id="user-password"
                  type="password"
                  {...createForm.register('password')}
                  placeholder="••••••••"
                />
                <FormFieldError error={createForm.formState.errors.password} />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Controller
                  name="role"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CREATE_ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormFieldError error={createForm.formState.errors.role} />
              </div>
              <div className="space-y-2">
                <Label>Établissement {!MULTI_FACILITY_ROLES.has(createForm.watch('role')) && <span className="text-destructive">*</span>}</Label>
                <Controller
                  name="facility"
                  control={createForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                <FormFieldError error={createForm.formState.errors.facility} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-phone">Téléphone</Label>
                  <Input
                    id="user-phone"
                    {...createForm.register('phone')}
                    placeholder="+213 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-dept">Département</Label>
                  <Input
                    id="user-dept"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Cardiologie"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>{creating ? 'Création...' : 'Créer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier l&apos;Utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l&apos;utilisateur.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmitUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Nom complet</Label>
                <Input
                  id="edit-user-name"
                  {...editForm.register('name')}
                  placeholder="Dr. Jean Dupont"
                />
                <FormFieldError error={editForm.formState.errors.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  {...editForm.register('email')}
                  placeholder="jean.dupont@dhayaro.cd"
                />
                <FormFieldError error={editForm.formState.errors.email} />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Controller
                  name="role"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDIT_ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormFieldError error={editForm.formState.errors.role} />
              </div>
              <div className="space-y-2">
                <Label>Établissement {!MULTI_FACILITY_ROLES.has(editForm.watch('role')) && <span className="text-destructive">*</span>}</Label>
                <Controller
                  name="facility"
                  control={editForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                <FormFieldError error={editForm.formState.errors.facility} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Supprimer l'utilisateur</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir désactiver <span className="font-medium">{deletingUser ? getUserDisplayName(deletingUser as unknown as Record<string, unknown>) : ''}</span> ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="receptionist">Réceptionniste</SelectItem>
                    <SelectItem value="doctor">Médecin</SelectItem>
                    <SelectItem value="specialist">Spécialiste</SelectItem>
                    <SelectItem value="laboratory">Laborantin</SelectItem>
                    <SelectItem value="pharmacist">Pharmacien</SelectItem>
                    <SelectItem value="nurse">Infirmier</SelectItem>
                    <SelectItem value="accountant">Comptable</SelectItem>
                    <SelectItem value="archivist">Archiviste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun résultat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun utilisateur ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center">
                      Utilisateur <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('email')}
                  >
                    <span className="flex items-center">
                      Email <SortIcon field="email" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('role')}
                  >
                    <span className="flex items-center">
                      Rôle <SortIcon field="role" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('facility')}
                  >
                    <span className="flex items-center">
                      Établissement <SortIcon field="facility" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <span className="flex items-center">
                      Dernière Connexion <SortIcon field="lastLogin" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('isActive')}
                  >
                    <span className="flex items-center">
                      Statut <SortIcon field="isActive" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </TableHead>
                  <TableHead className="w-[80px]">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {getInitials(getUserDisplayName(user as unknown as Record<string, unknown>))}
                        </div>
                        <div>
                          <p className="font-medium">{getUserDisplayName(user as unknown as Record<string, unknown>)}</p>
                          {user.facilityName && (
                            <p className="text-xs text-muted-foreground">
                              {user.facilityName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {facilityMap[user.facilityId || ''] || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin) : user.createdAt ? formatDate(user.createdAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'active' : 'secondary'}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {can('users:edit') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(user as User)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        )}
                        {can('users:delete') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { setDeletingUser(user as User); setDeleteOpen(true) }}
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

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount} utilisateur{totalCount > 1 ? 's' : ''} au
              total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
