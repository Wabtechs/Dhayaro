'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  Boxes,
  Building2,
  Calendar,
  FileText,
  Layers,
  MapPin,
  Pencil,
  QrCode,
  ShieldAlert,
  Trash2,
  User,
  Wrench,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEquipmentItemDetail,
  useEquipmentCategories,
  useUpdateEquipmentItem,
  useDeleteEquipmentItem,
} from '@/hooks/use-equipment-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES, EQUIPMENT_STATES } from '@/lib/api-schemas-equipment'
import type {
  EquipmentAssignment,
  EquipmentCategory,
  EquipmentDocument,
  EquipmentIncident,
  EquipmentLog,
  EquipmentMaintenance,
  EquipmentWarranty,
  MedicalEquipment,
} from '@/types/equipment'

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En usage',
  MAINTENANCE: 'En maintenance',
  BROKEN: 'En panne',
  RESERVED: 'Réservé',
  OUT_OF_SERVICE: 'Hors service',
  RETIRED: 'Retiré',
  LOST: 'Perdu',
}

const STATE_LABELS: Record<string, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon',
  FAIR: 'Moyen',
  POOR: 'Mauvais',
  CRITICAL: 'Critique',
}

const TYPE_LABELS: Record<string, string> = {
  BIOMEDICAL: 'Biomédical',
  MEDICAL: 'Médical',
  FURNITURE: 'Mobilier',
  IT: 'Informatique',
  OTHER: 'Autre',
}

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Préventive',
  CORRECTIVE: 'Corrective',
  INSPECTION: 'Inspection',
  CALIBRATION: 'Calibration',
  VALIDATION: 'Validation',
  REVISION: 'Révision',
}

const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Planifiée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  OVERDUE: 'En retard',
}

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En attente',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
}

const INCIDENT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
  URGENT: 'Urgente',
  CRITICAL: 'Critique',
}

const WARRANTY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  CLAIMED: 'Réclamée',
}

const DOC_CATEGORY_LABELS: Record<string, string> = {
  INVOICE: 'Facture',
  CONTRACT: 'Contrat',
  WARRANTY: 'Garantie',
  MANUAL: 'Manuel',
  REPORT: 'Rapport',
  CERTIFICATE: 'Certificat',
  PHOTO: 'Photo',
  OTHER: 'Autre',
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  IN_USE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  MAINTENANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  BROKEN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  RESERVED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  OUT_OF_SERVICE: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RETIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  LOST: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const STATE_BADGE: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  GOOD: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  FAIR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  POOR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

interface EquipmentDetail extends MedicalEquipment {
  locationName?: string
  responsibleUserLastname?: string
  assignments?: EquipmentAssignment[]
  maintenance?: EquipmentMaintenance[]
  incidents?: EquipmentIncident[]
  warranties?: EquipmentWarranty[]
  documents?: EquipmentDocument[]
  logs?: EquipmentLog[]
}

interface DetailFormState {
  code: string
  name: string
  type: string
  state: string
  status: string
  categoryId: string
  manufacturer: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  warrantyMonths: string
  lifecycleYears: string
  commissioningDate: string
  building: string
  floor: string
  department: string
  room: string
  position: string
  comments: string
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function numStr(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  return String(v)
}

function buildDetailPayload(f: DetailFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: f.code,
    name: f.name,
    type: f.type,
    state: f.state,
    status: f.status,
  }
  const optionalStrings: Array<keyof DetailFormState> = [
    'manufacturer',
    'brand',
    'model',
    'serialNumber',
    'purchaseDate',
    'commissioningDate',
    'building',
    'floor',
    'department',
    'room',
    'position',
    'comments',
  ]
  for (const key of optionalStrings) {
    if (f[key]) payload[key] = f[key]
  }
  if (f.categoryId) payload.categoryId = f.categoryId
  if (f.warrantyMonths !== '') payload.warrantyMonths = Number(f.warrantyMonths)
  if (f.lifecycleYears !== '') payload.lifecycleYears = Number(f.lifecycleYears)
  return payload
}

interface InfoFieldProps {
  label: string
  value: string
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

export { EquipmentItemDetailView }
export default function EquipmentItemDetailView() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { can } = usePermissions()

  const { data: detail, isLoading, error } = useEquipmentItemDetail(id)
  const { data: categoriesData } = useEquipmentCategories()
  const updateItem = useUpdateEquipmentItem()
  const deleteItem = useDeleteEquipmentItem()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DetailFormState>({
    code: '',
    name: '',
    type: 'BIOMEDICAL',
    state: 'NEW',
    status: 'AVAILABLE',
    categoryId: '',
    manufacturer: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyMonths: '',
    lifecycleYears: '',
    commissioningDate: '',
    building: '',
    floor: '',
    department: '',
    room: '',
    position: '',
    comments: '',
  })
  const [confirmDelete, setConfirmDelete] = useState<{ description: string; callback: () => void } | null>(null)

  if (!can('equipment:view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ShieldAlert className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Accès non autorisé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous n&apos;avez pas la permission de consulter le module des équipements médicaux.
        </p>
      </div>
    )
  }

  const d = detail as EquipmentDetail | undefined
  const categories = (categoriesData?.items ?? []) as EquipmentCategory[]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Équipement non trouvé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;équipement demandé n&apos;existe pas ou a été supprimé.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/equipment/items')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const equipmentId = d.id || id
  const typeLabel = TYPE_LABELS[String(d.type || '')] || String(d.type || '—')
  const statusLabel = STATUS_LABELS[String(d.status || '')] || String(d.status || '—')
  const stateLabel = STATE_LABELS[String(d.state || '')] || String(d.state || '—')
  const responsibleName = `${d.responsibleUserName || ''} ${d.responsibleUserLastname || ''}`.trim()
  const locationName = d.locationName || [d.building, d.floor, d.department, d.room].filter(Boolean).join(' / ')
  const assignments = d.assignments ?? []
  const maintenance = d.maintenance ?? []
  const incidents = d.incidents ?? []
  const warranties = d.warranties ?? []
  const documents = d.documents ?? []
  const logs = d.logs ?? []

  const openEditDialog = () => {
    setForm({
      code: str(d.code),
      name: str(d.name),
      type: str(d.type) || 'BIOMEDICAL',
      state: str(d.state) || 'NEW',
      status: str(d.status) || 'AVAILABLE',
      categoryId: str(d.categoryId),
      manufacturer: str(d.manufacturer),
      brand: str(d.brand),
      model: str(d.model),
      serialNumber: str(d.serialNumber),
      purchaseDate: str(d.purchaseDate),
      warrantyMonths: numStr(d.warrantyMonths),
      lifecycleYears: numStr(d.lifecycleYears),
      commissioningDate: str(d.commissioningDate),
      building: str(d.building),
      floor: str(d.floor),
      department: str(d.department),
      room: str(d.room),
      position: str(d.position),
      comments: str(d.comments),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await updateItem.mutateAsync([equipmentId, buildDetailPayload(form)])
      toast({ title: 'Équipement mis à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier l’équipement.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    setConfirmDelete({
      description: `Êtes-vous sûr de vouloir supprimer l’équipement "${d.name}" ?`,
      callback: async () => {
        try {
          await deleteItem.mutateAsync([equipmentId])
          toast({ title: 'Équipement supprimé', description: `"${d.name}" a été supprimé.` })
          router.push('/equipment/items')
        } catch {
          toast({ title: 'Erreur', description: 'Impossible de supprimer l’équipement.', variant: 'destructive' })
        }
      },
    })
  }

  const setField = (key: keyof DetailFormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/equipment/items')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {d.name || 'Sans nom'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{typeLabel}</Badge>
              <Badge className={STATUS_BADGE[String(d.status || '')] || ''}>{statusLabel}</Badge>
              <Badge className={STATE_BADGE[String(d.state || '')] || ''}>{stateLabel}</Badge>
              {d.code && (
                <span className="text-sm text-muted-foreground">{d.code}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('equipment:update') && (
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {can('equipment:delete') && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="identification">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="identification">Identification</TabsTrigger>
          <TabsTrigger value="lifecycle">Cycle de vie</TabsTrigger>
          <TabsTrigger value="localization">Localisation</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="identification" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identification</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Code" value={String(d.code || '')} />
                  <InfoField label="Type" value={typeLabel} />
                  <InfoField label="Catégorie" value={String(d.categoryName || '')} />
                  <InfoField label="Sous-catégorie" value={String(d.subCategoryId || '')} />
                  <InfoField label="QR Code" value={String(d.qrCode || '')} />
                  <InfoField label="Code-barres" value={String(d.barcode || '')} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground break-words">
                    {String(d.description || '—')}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsable</p>
                      <p className="text-sm font-medium text-foreground">{responsibleName || '—'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Statut</p>
                      <p className="text-sm font-medium text-foreground">{statusLabel}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">État</p>
                      <p className="text-sm font-medium text-foreground">{stateLabel}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Créé le</p>
                      <p className="text-sm text-foreground">{formatDate(d.createdAt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mis à jour le</p>
                      <p className="text-sm text-foreground">{formatDate(d.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cycle de vie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Fabricant" value={String(d.manufacturer || '')} />
              <InfoField label="Marque" value={String(d.brand || '')} />
              <InfoField label="Modèle" value={String(d.model || '')} />
              <InfoField label="N° de série" value={String(d.serialNumber || '')} />
              <InfoField label="Date d'achat" value={formatDate(d.purchaseDate)} />
              <InfoField
                label="Prix d'achat"
                value={d.purchasePrice != null ? `${d.purchasePrice} ${String(d.currency || 'CDF')}` : ''}
              />
              <InfoField label="Garantie (mois)" value={d.warrantyMonths != null ? String(d.warrantyMonths) : ''} />
              <InfoField label="Durée de vie (ans)" value={d.lifecycleYears != null ? String(d.lifecycleYears) : ''} />
              <InfoField label="Mise en service" value={formatDate(d.commissioningDate)} />
              <InfoField label="Retrait" value={formatDate(d.retirementDate)} />
              <InfoField label="Statut" value={statusLabel} />
              <InfoField label="État" value={stateLabel} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Localisation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Localisation" value={locationName} />
              <InfoField label="Bâtiment" value={String(d.building || '')} />
              <InfoField label="Étage" value={String(d.floor || '')} />
              <InfoField label="Département" value={String(d.department || '')} />
              <InfoField label="Salle" value={String(d.room || '')} />
              <InfoField label="Emplacement" value={String(d.position || '')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Affectations</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assigné à</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {a.assignedToName || a.assignedToId || '—'}
                        </TableCell>
                        <TableCell>{a.department || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(a.startedAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(a.endedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {maintenance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maintenances</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date prévue</TableHead>
                      <TableHead>Technicien</TableHead>
                      <TableHead>Coût</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {MAINTENANCE_TYPE_LABELS[String(m.maintenanceType)] || String(m.maintenanceType || '—')}
                          </Badge>
                        </TableCell>
                        <TableCell>{MAINTENANCE_STATUS_LABELS[String(m.status)] || String(m.status || '—')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(m.scheduledDate)}</TableCell>
                        <TableCell>{m.technicianName || m.company || '—'}</TableCell>
                        <TableCell>
                          {m.cost != null ? `${m.cost} ${String(m.currency || 'CDF')}` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {incidents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Incidents</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Signalé par</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell className="font-medium">{inc.title || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {INCIDENT_PRIORITY_LABELS[String(inc.priority)] || String(inc.priority || '—')}
                          </Badge>
                        </TableCell>
                        <TableCell>{INCIDENT_STATUS_LABELS[String(inc.status)] || String(inc.status || '—')}</TableCell>
                        <TableCell>{inc.reportedByName || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(inc.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {warranties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Garanties</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warranties.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.supplierName || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(w.startDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(w.endDate)}</TableCell>
                        <TableCell>{WARRANTY_STATUS_LABELS[String(w.status)] || String(w.status || '—')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DOC_CATEGORY_LABELS[String(doc.category)] || String(doc.category || '—')}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journal d&apos;activité</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action || '—'}</TableCell>
                        <TableCell>{log.userName || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {assignments.length === 0 &&
            maintenance.length === 0 &&
            incidents.length === 0 &&
            warranties.length === 0 &&
            documents.length === 0 &&
            logs.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">Aucun historique disponible</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;équipement</DialogTitle>
            <DialogDescription>
              Modifiez les détails de l&apos;équipement ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdate()
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {TYPE_LABELS[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>État</Label>
                <Select value={form.state} onValueChange={(v) => setField('state', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {STATE_LABELS[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {STATUS_LABELS[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categoryId} onValueChange={(v) => setField('categoryId', v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>N° de série</Label>
                <Input
                  value={form.serialNumber}
                  onChange={(e) => setField('serialNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Fabricant</Label>
                <Input value={form.manufacturer} onChange={(e) => setField('manufacturer', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Marque</Label>
                <Input value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Input value={form.model} onChange={(e) => setField('model', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Date d'achat</Label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setField('purchaseDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Garantie (mois)</Label>
                <Input
                  type="number"
                  value={form.warrantyMonths}
                  onChange={(e) => setField('warrantyMonths', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Durée de vie (ans)</Label>
                <Input
                  type="number"
                  value={form.lifecycleYears}
                  onChange={(e) => setField('lifecycleYears', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mise en service</Label>
                <Input
                  type="date"
                  value={form.commissioningDate}
                  onChange={(e) => setField('commissioningDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <div className="space-y-2">
                <Label>Bâtiment</Label>
                <Input value={form.building} onChange={(e) => setField('building', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Étage</Label>
                <Input value={form.floor} onChange={(e) => setField('floor', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Input value={form.department} onChange={(e) => setField('department', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salle</Label>
                <Input value={form.room} onChange={(e) => setField('room', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Emplacement</Label>
                <Input value={form.position} onChange={(e) => setField('position', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Commentaires</Label>
              <Textarea
                rows={3}
                value={form.comments}
                onChange={(e) => setField('comments', e.target.value)}
              />
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
