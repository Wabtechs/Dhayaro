'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Bed,
  LayoutGrid,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  mockFacilities,
  mockUsers,
  mockPatients,
  mockClinicalCases,
} from '@/lib/mock-data'
import { formatDate, getInitials } from '@/lib/utils'
import type { Facility } from '@/types'

const facilityTypeLabels: Record<Facility['type'], string> = {
  hospital: 'Hôpital',
  clinic: 'Clinique',
  laboratory: 'Laboratoire',
  pharmacy: 'Pharmacie',
}

const facilityTypeIcons: Record<Facility['type'], React.ReactNode> = {
  hospital: <Building2 className="h-5 w-5" />,
  clinic: <Stethoscope className="h-5 w-5" />,
  laboratory: <FlaskConical className="h-5 w-5" />,
  pharmacy: <Pill className="h-5 w-5" />,
}

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

const caseStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En revue',
  resolved: 'Résolu',
  archived: 'Archivé',
}

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>()
  const facility = mockFacilities.find((f) => f.id === id)

  if (!facility) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="mt-6 text-xl font-bold">Établissement non trouvé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L'établissement demandé n'existe pas ou a été supprimé.
        </p>
        <Button asChild className="mt-6">
          <Link href="/facilities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux établissements
          </Link>
        </Button>
      </div>
    )
  }

  const facilityUsers = mockUsers.filter((u) => u.facility === facility.id)
  const facilityPatients = mockPatients.filter(
    (p) => p.facilityId === facility.id
  )
  const facilityCases = mockClinicalCases.filter(
    (c) => c.facilityId === facility.id
  )

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="w-fit -ml-2">
        <Link href="/facilities">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {facilityTypeIcons[facility.type]}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {facility.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">
                {facilityTypeLabels[facility.type]}
              </Badge>
              <Badge variant={facility.isActive ? 'active' : 'secondary'}>
                {facility.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Adresse</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.address}, {facility.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Créé le</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(facility.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{facility.bedCount}</p>
                <p className="text-xs text-muted-foreground">Lits</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {facility.departmentCount}
                </p>
                <p className="text-xs text-muted-foreground">Départements</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{facility.staffCount}</p>
                <p className="text-xs text-muted-foreground">Personnel</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">
            Personnel ({facilityUsers.length})
          </TabsTrigger>
          <TabsTrigger value="patients">
            Patients ({facilityPatients.length})
          </TabsTrigger>
          <TabsTrigger value="cases">
            Cas Cliniques ({facilityCases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardContent className="p-0">
              {facilityUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucun personnel assigné à cet établissement.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilityUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {getInitials(user.name)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadgeColors[user.role]}`}
                          >
                            {roleLabels[user.role]}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.department || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'active' : 'secondary'}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardContent className="p-0">
              {facilityPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucun patient enregistré dans cet établissement.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>N° dossier</TableHead>
                      <TableHead>Date de naissance</TableHead>
                      <TableHead>Groupe sanguin</TableHead>
                      <TableHead>Dernière visite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilityPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient.medicalRecordNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(patient.dateOfBirth)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{patient.bloodType}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient.lastVisit
                            ? formatDate(patient.lastVisit)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardContent className="p-0">
              {facilityCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Stethoscope className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucun cas clinique pour cet établissement.
                  </p>
                </div>
              ) : (
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
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status as 'active' | 'in_review' | 'resolved' | 'draft' | 'archived'}>
                            {caseStatusLabels[c.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.priority as 'low' | 'medium' | 'high' | 'critical'}>
                            {c.priority === 'critical'
                              ? 'Critique'
                              : c.priority === 'high'
                              ? 'Haute'
                              : c.priority === 'medium'
                              ? 'Moyenne'
                              : 'Basse'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
