'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bug,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  useDiseaseDetail,
  useUpdateDisease,
  useDeleteDisease,
} from '@/hooks/use-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/utils'

const severityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' },
  MODERATE: { label: 'Modérée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  HIGH: { label: 'Élevée', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  CRITICAL: { label: 'Critique', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const commaSplit = (str?: string) =>
  str ? str.split(',').map((s) => s.trim()).filter(Boolean) : []
const commaJoin = (arr?: string[]) => (arr || []).join(', ')

interface DiseaseDetail {
  id: string
  code: string
  name: string
  category: string
  description?: string
  symptoms: string[]
  complications: string[]
  treatments: string[]
  isContagious?: boolean
  severity?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

interface DiseaseForm {
  code: string
  name: string
  category: string
  description: string
  severity: string
  isContagious: boolean
  symptoms: string
  complications: string
  treatments: string
}

export default function DiseaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { can } = usePermissions()

  const { data: disease, isLoading, error } = useDiseaseDetail(id)
  const updateDisease = useUpdateDisease()
  const deleteDisease = useDeleteDisease()
  const { toast } = useToast()

  const d = disease as DiseaseDetail | null | undefined

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<DiseaseForm>({
    code: '',
    name: '',
    category: '',
    description: '',
    severity: 'MODERATE',
    isContagious: false,
    symptoms: '',
    complications: '',
    treatments: '',
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de la maladie...</p>
      </div>
    )
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">
          Maladie non trouvée
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La maladie demandée n&apos;existe pas ou a été supprimée.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push('/diseases')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const diseaseId = d.id || id
  const code = d.code || ''
  const name = d.name || '—'
  const category = d.category || '—'
  const description = d.description || ''
  const severity = String(d.severity || '').toUpperCase()
  const severityConf = severityConfig[severity] || { label: severity || '—', color: 'bg-gray-100 text-gray-700' }
  const isContagious = Boolean(d.isContagious)
  const isActive = d.isActive !== false
  const symptoms = d.symptoms || []
  const complications = d.complications || []
  const treatments = d.treatments || []
  const createdAt = d.createdAt || ''
  const updatedAt = d.updatedAt || ''

  const openEditDialog = () => {
    setEditForm({
      code: d.code || '',
      name: d.name || '',
      category: d.category || '',
      description: d.description || '',
      severity: d.severity || 'MODERATE',
      isContagious: Boolean(d.isContagious),
      symptoms: commaJoin(d.symptoms),
      complications: commaJoin(d.complications),
      treatments: commaJoin(d.treatments),
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDisease.mutateAsync({
        id: diseaseId,
        data: {
          code: editForm.code,
          name: editForm.name,
          category: editForm.category,
          description: editForm.description || null,
          severity: editForm.severity,
          isContagious: editForm.isContagious,
          symptoms: commaSplit(editForm.symptoms),
          complications: commaSplit(editForm.complications),
          treatments: commaSplit(editForm.treatments),
        } as unknown as Record<string, unknown>,
      })
      toast({ title: 'Maladie mise à jour', description: 'Les modifications ont été enregistrées.' })
      setEditDialogOpen(false)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier la maladie.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la maladie "${name}" (${code}) ?`)) return
    try {
      await deleteDisease.mutateAsync(diseaseId)
      toast({ title: 'Maladie supprimée', description: `"${name}" a été supprimée.` })
      router.push('/diseases')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la maladie.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push('/diseases')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Bug className="h-5 w-5 text-primary" />
              {name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">{code}</Badge>
              <Badge className={severityConf.color}>{severityConf.label}</Badge>
              <Badge
                className={
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-300'
                }
              >
                {isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can('diseases:create') && (
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
          {can('diseases:create') && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}

          {symptoms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4" />
                  Symptômes ({symptoms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {complications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4" />
                  Complications ({complications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {complications.map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {treatments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bug className="h-4 w-4" />
                  Traitements ({treatments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {treatments.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Bug className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="text-sm font-medium text-foreground">{category}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sévérité</p>
                  <Badge className={severityConf.color}>{severityConf.label}</Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contagieux</p>
                  <p className="text-sm font-medium text-foreground">{isContagious ? 'Oui' : 'Non'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="text-sm text-foreground">{formatDate(createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mis à jour le</p>
                  <p className="text-sm text-foreground">{formatDate(updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la maladie</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la maladie ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code *</label>
                <Input
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie *</label>
              <Input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sévérité</label>
                <Select value={editForm.severity} onValueChange={(v) => setEditForm({ ...editForm, severity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MODERATE">Modérée</SelectItem>
                    <SelectItem value="HIGH">Élevée</SelectItem>
                    <SelectItem value="CRITICAL">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editForm.isContagious}
                    onChange={(e) => setEditForm({ ...editForm, isContagious: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Contagieux
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Symptômes (séparés par des virgules)</label>
              <Input
                value={editForm.symptoms}
                onChange={(e) => setEditForm({ ...editForm, symptoms: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Complications (séparés par des virgules)</label>
              <Input
                value={editForm.complications}
                onChange={(e) => setEditForm({ ...editForm, complications: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Traitements (séparés par des virgules)</label>
              <Input
                value={editForm.treatments}
                onChange={(e) => setEditForm({ ...editForm, treatments: e.target.value })}
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
    </div>
  )
}
