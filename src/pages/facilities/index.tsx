import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  MapPin,
  Phone,
  Users,
  Plus,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useFacilitiesData } from '@/hooks/use-data'
import type { Facility } from '@/types'

const facilityTypeIcons: Record<Facility['type'], React.ReactNode> = {
  hospital: <Building2 className="h-6 w-6" />,
  clinic: <Stethoscope className="h-6 w-6" />,
  laboratory: <FlaskConical className="h-6 w-6" />,
  pharmacy: <Pill className="h-6 w-6" />,
}

const facilityTypeLabels: Record<Facility['type'], string> = {
  hospital: 'Hôpital',
  clinic: 'Clinique',
  laboratory: 'Laboratoire',
  pharmacy: 'Pharmacie',
}

export default function Facilities() {
  const { data, isLoading } = useFacilitiesData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])

  useEffect(() => {
    if (data?.items) {
      setFacilities(data.items)
    }
  }, [data?.items])

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Facility['type']>('hospital')
  const [newAddress, setNewAddress] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newBedCount, setNewBedCount] = useState('')

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.city.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || f.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const facility: Facility = {
      id: `fac-${String(facilities.length + 1).padStart(3, '0')}`,
      name: newName,
      type: newType,
      address: newAddress,
      city: newCity,
      country: 'Algérie',
      phone: newPhone,
      email: newEmail,
      bedCount: parseInt(newBedCount) || 0,
      departmentCount: 0,
      staffCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    setFacilities((prev) => [...prev, facility])
    setDialogOpen(false)
    setNewName('')
    setNewType('hospital')
    setNewAddress('')
    setNewCity('')
    setNewPhone('')
    setNewEmail('')
    setNewBedCount('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Établissements de Santé
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les établissements médicaux de la plateforme
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel Établissement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvel Établissement</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel établissement de santé à la plateforme.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fac-name">Nom</Label>
                <Input
                  id="fac-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom de l'établissement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as Facility['type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hôpital</SelectItem>
                    <SelectItem value="clinic">Clinique</SelectItem>
                    <SelectItem value="laboratory">Laboratoire</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fac-address">Adresse</Label>
                <Input
                  id="fac-address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Adresse complète"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fac-city">Ville</Label>
                <Input
                  id="fac-city"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ville"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fac-phone">Téléphone</Label>
                  <Input
                    id="fac-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+213 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fac-email">Email</Label>
                  <Input
                    id="fac-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="contact@..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fac-beds">Nombre de lits</Label>
                <Input
                  id="fac-beds"
                  type="number"
                  value={newBedCount}
                  onChange={(e) => setNewBedCount(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="hospital">Hôpital</SelectItem>
            <SelectItem value="clinic">Clinique</SelectItem>
            <SelectItem value="laboratory">Laboratoire</SelectItem>
            <SelectItem value="pharmacy">Pharmacie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun résultat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun établissement ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((facility) => (
            <Card key={facility.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {facilityTypeIcons[facility.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate text-base">
                    {facility.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {facilityTypeLabels[facility.type]}
                  </p>
                </div>
                <Badge variant={facility.isActive ? 'active' : 'secondary'}>
                  {facility.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {facility.address}, {facility.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{facility.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
                  <div>
                    <p className="text-lg font-semibold">{facility.bedCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Lits</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {facility.departmentCount ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Départements
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {facility.staffCount ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Personnel</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      {facility.staffCount
                        ? `${facility.staffCount} employés`
                        : '—'}
                    </span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/facilities/${facility.id}`}>
                      Voir détails →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
