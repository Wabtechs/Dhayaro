'use client'

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
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
import { useUsersData, useFacilitiesData, useUpdateUser } from '@/hooks/use-data'
import { api } from '@/services/api'
import { formatDate, getInitials } from '@/lib/utils'
import { sanitizeUuid } from '@/lib/validation'
import { usePermissions } from '@/hooks/use-permissions'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/types'

const PAGE_SIZE = 10

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Médecin',
  nurse: 'Infirmier',
  researcher: 'Chercheur',
  viewer: 'Observateur',
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  doctor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  nurse: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  researcher:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
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
  const { data: usersData, isLoading } = useUsersData()
  const { data: facilitiesData } = useFacilitiesData()
  const updateUser = useUpdateUser()
  const users = usersData?.items ?? []
  const facilitiesList = facilitiesData?.items ?? []
  const [localUsers] = useState<User[]>([])

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<User['role']>('doctor')
  const [newFacility, setNewFacility] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<User['role']>('doctor')
  const [editFacility, setEditFacility] = useState('')

  const facilityMap = useMemo(
    () => Object.fromEntries(facilitiesList.map((f) => [f.id, f.name])),
    [facilitiesList]
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const allUsers = useMemo(() => {
    const merged = [...users, ...localUsers]
    return merged.map((u) => ({
      ...u,
      role: (u.role || '').toLowerCase(),
    }))
  }, [users, localUsers])

  const filtered = useMemo(() => {
    const result = allUsers.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })

    result.sort((a, b) => {
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
          aVal = facilityMap[a.facility || ''] || ''
          bVal = facilityMap[b.facility || ''] || ''
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

    return result
  }, [allUsers, search, roleFilter, sortField, sortDir, facilityMap])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const ROLE_MAP: Record<User['role'], string> = {
    admin: 'ADMIN',
    doctor: 'DOCTOR',
    nurse: 'NURSE',
    researcher: 'RESEARCHER',
    viewer: 'VIEWER',
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const token = localStorage.getItem('medinsight_token') || ''
      const nameParts = newName.trim().split(' ')
      const firstname = nameParts[0] || newName
      const lastname = nameParts.slice(1).join(' ') || newName
      await api.post('/users', {
        firstname,
        lastname,
        email: newEmail,
        password: newPassword,
        role: ROLE_MAP[newRole] || 'DOCTOR',
        facilityId: sanitizeUuid(newFacility),
      }, token)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Utilisateur créé', description: `${newName} a été ajouté.` })
      setDialogOpen(false)
      setNewName('')
      setNewEmail('')
      setNewRole('doctor')
      setNewFacility('')
      setNewPhone('')
      setNewDepartment('')
      setNewPassword('')
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'utilisateur.", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditFacility(user.facility || '')
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true)
    try {
      const nameParts = editName.trim().split(' ')
      const firstname = nameParts[0] || editName
      const lastname = nameParts.slice(1).join(' ') || editName
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: {
          firstname,
          lastname,
          email: editEmail,
          role: ROLE_MAP[editRole] || 'DOCTOR',
          facilityId: sanitizeUuid(editFacility),
        },
      })
      toast({ title: 'Utilisateur mis à jour', description: `${editName} a été modifié.` })
      setEditDialogOpen(false)
      setEditingUser(null)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de modifier l'utilisateur.", variant: 'destructive' })
    } finally {
      setSaving(false)
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
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nom complet</Label>
                <Input
                  id="user-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Dr. Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jean.dupont@medinsight.cd"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Mot de passe</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={newRole}
                  onValueChange={(v) => setNewRole(v as User['role'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Médecin</SelectItem>
                    <SelectItem value="nurse">Infirmier</SelectItem>
                    <SelectItem value="researcher">Chercheur</SelectItem>
                    <SelectItem value="viewer">Observateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Établissement</Label>
                <Select value={newFacility} onValueChange={setNewFacility}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-phone">Téléphone</Label>
                  <Input
                    id="user-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+243 ..."
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
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Nom complet</Label>
                <Input
                  id="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Dr. Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="jean.dupont@medinsight.cd"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editRole}
                  onValueChange={(v) => setEditRole(v as User['role'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Médecin</SelectItem>
                    <SelectItem value="nurse">Infirmier</SelectItem>
                    <SelectItem value="researcher">Chercheur</SelectItem>
                    <SelectItem value="viewer">Observateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Établissement</Label>
                <Select value={editFacility} onValueChange={setEditFacility}>
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
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Médecin</SelectItem>
            <SelectItem value="nurse">Infirmier</SelectItem>
            <SelectItem value="researcher">Chercheur</SelectItem>
            <SelectItem value="viewer">Observateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
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
                {paginated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.department && (
                            <p className="text-xs text-muted-foreground">
                              {user.department}
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
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadgeColors[user.role] || roleBadgeColors.viewer}`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {facilityMap[user.facility || ''] || '—'}
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
                          onClick={() => {
                            toast({ title: "Bientôt disponible", description: "La suppression sera disponible prochainement" })
                          }}
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
              {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} au
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
