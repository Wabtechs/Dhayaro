import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, type SettingsValues } from "@/lib/schemas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Clock,
  Save,
  Download,
} from "lucide-react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useUpdateSettings } from "@/hooks/use-data";
import { PwaSettingsPanel } from "@/components/pwa/pwa-settings-panel";

const DEFAULT_SETTINGS: SettingsValues = {
  platformName: "Dhayaro",
  language: "fr",
  timezone: "Africa/Kinshasa",
  facility: "hospital-central",
  dateFormat: "DD/MM/YYYY",
  emailNotifications: true,
  newCaseAlerts: true,
  caseUpdateAlerts: true,
  reminderAlerts: true,
  reportAlerts: true,
  emailFrequency: "daily",
  twoFactorAuth: false,
  sessionTimeout: 30,
  sidebarHover: true,
  compactMode: false,
};

export default function SettingsPage() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { toast } = useToast();
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName: '',
      language: 'fr',
      timezone: 'Africa/Kinshasa',
      facility: '',
      dateFormat: 'DD/MM/YYYY',
      emailNotifications: true,
      newCaseAlerts: true,
      caseUpdateAlerts: true,
      reminderAlerts: true,
      reportAlerts: true,
      emailFrequency: 'daily',
      twoFactorAuth: false,
      sessionTimeout: 30,
      sidebarHover: true,
      compactMode: false,
    },
  });

  useEffect(() => {
    if (settingsData?.preferences) {
      const p = settingsData.preferences as unknown as Partial<SettingsValues>;
      reset({
        platformName: p.platformName ?? DEFAULT_SETTINGS.platformName,
        language: p.language ?? DEFAULT_SETTINGS.language,
        timezone: p.timezone ?? DEFAULT_SETTINGS.timezone,
        facility: p.facility ?? DEFAULT_SETTINGS.facility,
        dateFormat: p.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
        emailNotifications: p.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
        newCaseAlerts: p.newCaseAlerts ?? DEFAULT_SETTINGS.newCaseAlerts,
        caseUpdateAlerts: p.caseUpdateAlerts ?? DEFAULT_SETTINGS.caseUpdateAlerts,
        reminderAlerts: p.reminderAlerts ?? DEFAULT_SETTINGS.reminderAlerts,
        reportAlerts: p.reportAlerts ?? DEFAULT_SETTINGS.reportAlerts,
        emailFrequency: p.emailFrequency ?? DEFAULT_SETTINGS.emailFrequency,
        twoFactorAuth: p.twoFactorAuth ?? DEFAULT_SETTINGS.twoFactorAuth,
        sessionTimeout: p.sessionTimeout != null ? Number(p.sessionTimeout) : DEFAULT_SETTINGS.sessionTimeout,
        sidebarHover: p.sidebarHover ?? DEFAULT_SETTINGS.sidebarHover,
        compactMode: p.compactMode ?? DEFAULT_SETTINGS.compactMode,
      });
    }
  }, [settingsData, reset]);

  const handleSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync(values as unknown as Record<string, unknown>);
      setSaved(true);
      toast({ title: "Paramètres sauvegardés", description: "Vos préférences ont été enregistrées." });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les paramètres.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-1 h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-9 w-full rounded-md" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-9 w-full rounded-md" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-full rounded-md" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-9 w-full rounded-md" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-full rounded-md" /></div>
            </div>
          </CardContent>
          <CardFooter><Skeleton className="h-9 w-28 rounded-md" /></CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres Système</h1>
        <p className="text-muted-foreground">Configurez les paramètres de la plateforme Dhayaro.</p>
      </div>

      <Separator />

      {saved && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Paramètres sauvegardés avec succès
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="app">
            <Download className="mr-2 h-4 w-4" />
            Application
          </TabsTrigger>
        </TabsList>

        {/* ── Général ─────────────────────────────────────────── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>Configuration de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Nom de la Plateforme</Label>
                  <Input
                    id="platform-name"
                    {...register("platformName")}
                  />
                  {errors.platformName && (
                    <p className="text-xs text-destructive">{errors.platformName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <Globe className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Sélectionner une langue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuseau Horaire</Label>
                  <Controller
                    name="timezone"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Sélectionner un fuseau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Algiers">Africa/Algiers (UTC+1)</SelectItem>
                          <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                          <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Établissement par Défaut</Label>
                  <Controller
                    name="facility"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un établissement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital-central">Hôpital Central</SelectItem>
                          <SelectItem value="clinique-sainte-marie">Clinique Sainte-Marie</SelectItem>
                          <SelectItem value="centre-medical-nord">Centre Médical du Nord</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Format de Date</Label>
                  <Controller
                    name="dateFormat"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Notifications ──────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Notifications</CardTitle>
              <CardDescription>Gérez vos préférences de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications par Email</p>
                    <p className="text-sm text-muted-foreground">Recevoir les notifications par email</p>
                  </div>
                  <Controller
                    name="emailNotifications"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveau Cas</p>
                    <p className="text-sm text-muted-foreground">Notification lors de l'ajout d'un nouveau cas</p>
                  </div>
                  <Controller
                    name="newCaseAlerts"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mise à Jour de Cas</p>
                    <p className="text-sm text-muted-foreground">Notification lors de la modification d'un cas</p>
                  </div>
                  <Controller
                    name="caseUpdateAlerts"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels</p>
                    <p className="text-sm text-muted-foreground">Rappels pour les tâches en attente</p>
                  </div>
                  <Controller
                    name="reminderAlerts"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapports</p>
                    <p className="text-sm text-muted-foreground">Notification lors de la génération de rapports</p>
                  </div>
                  <Controller
                    name="reportAlerts"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fréquence des Emails</Label>
                <Controller
                  name="emailFrequency"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Sélectionner la fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Temps réel</SelectItem>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Sécurité ───────────────────────────────────────── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>Configurez la sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentification à Deux Facteurs</p>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                </div>
                <Controller
                  name="twoFactorAuth"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Expiration de Session</Label>
                <Controller
                  name="sessionTimeout"
                  control={control}
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Sélectionner le délai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <Separator />

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Politique de Mot de Passe</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Minimum 8 caractères</li>
                  <li>• Au moins une majuscule et une minuscule</li>
                  <li>• Au moins un chiffre</li>
                  <li>• Au moins un caractère spécial (!@#$%^&*)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Apparence ──────────────────────────────────────── */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'Apparence</CardTitle>
              <CardDescription>Personnalisez l'apparence de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode Sombre</p>
                  <p className="text-sm text-muted-foreground">
                    Activer le thème sombre pour l'interface
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Barre Latérale au Survol</p>
                  <p className="text-sm text-muted-foreground">
                    Déplier la barre latérale au survol de la souris
                  </p>
                </div>
                <Controller
                  name="sidebarHover"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode Compact</p>
                  <p className="text-sm text-muted-foreground">
                    Réduire l'espacement pour afficher plus de contenu
                  </p>
                </div>
                <Controller
                  name="compactMode"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <Separator />

              <div>
                <p className="mb-2 font-medium">Couleur Principale</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-primary bg-primary" />
                  <span className="text-sm text-muted-foreground">Bleu Dhayaro (par défaut)</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Application (PWA) ─────────────────────────────── */}
        <TabsContent value="app">
          <PwaSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
