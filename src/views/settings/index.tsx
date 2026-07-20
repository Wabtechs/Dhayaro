import { useState, useEffect } from "react";
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
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Clock,
  Save,
} from "lucide-react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "dhayaro_settings";

interface SavedSettings {
  platformName: string;
  language: string;
  timezone: string;
  facility: string;
  dateFormat: string;
  emailNotifications: boolean;
  newCaseAlerts: boolean;
  caseUpdateAlerts: boolean;
  reminderAlerts: boolean;
  reportAlerts: boolean;
  emailFrequency: string;
  twoFactorAuth: boolean;
  sessionTimeout: string;
  sidebarHover: boolean;
  compactMode: boolean;
}

function loadSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse errors, use defaults */ }
  return {
    platformName: "Dhayaro",
    language: "fr",
    timezone: "Africa/Algiers",
    facility: "hospital-central",
    dateFormat: "DD/MM/YYYY",
    emailNotifications: true,
    newCaseAlerts: true,
    caseUpdateAlerts: true,
    reminderAlerts: false,
    reportAlerts: true,
    emailFrequency: "daily",
    twoFactorAuth: false,
    sessionTimeout: "30",
    sidebarHover: true,
    compactMode: false,
  };
}

export default function SettingsPage() {
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [platformName, setPlatformName] = useState("Dhayaro");
  const [language, setLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Africa/Algiers");
  const [facility, setFacility] = useState("hospital-central");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newCaseAlerts, setNewCaseAlerts] = useState(true);
  const [caseUpdateAlerts, setCaseUpdateAlerts] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(false);
  const [reportAlerts, setReportAlerts] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("daily");

  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [sidebarHover, setSidebarHover] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setPlatformName(loaded.platformName);
    setLanguage(loaded.language);
    setTimezone(loaded.timezone);
    setFacility(loaded.facility);
    setDateFormat(loaded.dateFormat);
    setEmailNotifications(loaded.emailNotifications);
    setNewCaseAlerts(loaded.newCaseAlerts);
    setCaseUpdateAlerts(loaded.caseUpdateAlerts);
    setReminderAlerts(loaded.reminderAlerts);
    setReportAlerts(loaded.reportAlerts);
    setEmailFrequency(loaded.emailFrequency);
    setTwoFactorAuth(loaded.twoFactorAuth);
    setSessionTimeout(loaded.sessionTimeout);
    setSidebarHover(loaded.sidebarHover);
    setCompactMode(loaded.compactMode);
  }, []);

  const handleSave = () => {
    setSaving(true);
    const settings: SavedSettings = {
      platformName, language, timezone, facility, dateFormat,
      emailNotifications, newCaseAlerts, caseUpdateAlerts, reminderAlerts, reportAlerts, emailFrequency,
      twoFactorAuth, sessionTimeout, sidebarHover, compactMode,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast({ title: "Paramètres sauvegardés", description: "Vos préférences ont été enregistrées." });
      setTimeout(() => setSaved(false), 2500);
    }, 500);
  };

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
        <TabsList className="grid w-full grid-cols-4">
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
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select value={language} onValueChange={setLanguage}>
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
                </div>

                <div className="space-y-2">
                  <Label>Fuseau Horaire</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
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
                </div>

                <div className="space-y-2">
                  <Label>Établissement par Défaut</Label>
                  <Select value={facility} onValueChange={setFacility}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un établissement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital-central">Hôpital Central</SelectItem>
                      <SelectItem value="clinique-sainte-marie">Clinique Sainte-Marie</SelectItem>
                      <SelectItem value="centre-medical-nord">Centre Médical du Nord</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format de Date</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveau Cas</p>
                    <p className="text-sm text-muted-foreground">Notification lors de l'ajout d'un nouveau cas</p>
                  </div>
                  <Switch checked={newCaseAlerts} onCheckedChange={setNewCaseAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mise à Jour de Cas</p>
                    <p className="text-sm text-muted-foreground">Notification lors de la modification d'un cas</p>
                  </div>
                  <Switch checked={caseUpdateAlerts} onCheckedChange={setCaseUpdateAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels</p>
                    <p className="text-sm text-muted-foreground">Rappels pour les tâches en attente</p>
                  </div>
                  <Switch checked={reminderAlerts} onCheckedChange={setReminderAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapports</p>
                    <p className="text-sm text-muted-foreground">Notification lors de la génération de rapports</p>
                  </div>
                  <Switch checked={reportAlerts} onCheckedChange={setReportAlerts} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fréquence des Emails</Label>
                <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Sélectionner la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Temps réel</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
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
                <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Expiration de Session</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
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
                <Switch checked={sidebarHover} onCheckedChange={setSidebarHover} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode Compact</p>
                  <p className="text-sm text-muted-foreground">
                    Réduire l'espacement pour afficher plus de contenu
                  </p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
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
      </Tabs>
    </div>
  );
}
