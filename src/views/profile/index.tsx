import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store";
import { useUpdateUser } from "@/hooks/use-data";
import {
  User,
  Building2,
  Edit,
  Save,
  Activity,
  Clock,
  Palette,
  FileText,
  Search,
  Settings,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

const recentActivity = [
  {
    id: 1,
    icon: FileText,
    description: "A modifié le cas clinique #1234",
    timestamp: "2026-07-12T10:30:00",
  },
  {
    id: 2,
    icon: Eye,
    description: "A consulté le dossier du patient Karim M.",
    timestamp: "2026-07-12T09:15:00",
  },
  {
    id: 3,
    icon: Plus,
    description: "A créé un nouveau cas clinique #1235",
    timestamp: "2026-07-11T16:45:00",
  },
  {
    id: 4,
    icon: Search,
    description: "A effectué une recherche sur \"cardiovasculaire\"",
    timestamp: "2026-07-11T14:20:00",
  },
  {
    id: 5,
    icon: FileText,
    description: "A exporté le rapport mensuel de juin 2026",
    timestamp: "2026-07-10T11:00:00",
  },
  {
    id: 6,
    icon: Settings,
    description: "A modifié les paramètres de notification",
    timestamp: "2026-07-10T08:30:00",
  },
  {
    id: 7,
    icon: Eye,
    description: "A consulté les statistiques du facility",
    timestamp: "2026-07-09T15:10:00",
  },
  {
    id: 8,
    icon: Trash2,
    description: "A supprimé le cas clinique #1198 (doublon)",
    timestamp: "2026-07-09T10:05:00",
  },
  {
    id: 9,
    icon: Plus,
    description: "A ajouté un nouveau patient au système",
    timestamp: "2026-07-08T14:00:00",
  },
  {
    id: 10,
    icon: FileText,
    description: "A généré un rapport d'activité hebdomadaire",
    timestamp: "2026-07-07T09:00:00",
  },
];

const roleBadge: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  researcher: "bg-indigo-100 text-indigo-800",
  doctor: "bg-blue-100 text-blue-800",
  nurse: "bg-green-100 text-green-800",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  return `il y a ${diffD}j`;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const updateUser = useUpdateUser();

  const [name, setName] = useState(user?.name ?? "Dr. Jean-Pierre Lukusa");
  const [email, setEmail] = useState(user?.email ?? "admin@dhayaro.cd");
  const [phone, setPhone] = useState("+243 81 200 001");
  const [department, setDepartment] = useState("Cardiologie");

  const [prefLanguage, setPrefLanguage] = useState("fr");
  const [prefTimezone, setPrefTimezone] = useState("Africa/Kinshasa");
  const [emailNotif, setEmailNotif] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState("25");

  const [saving, setSaving] = useState(false);

  const handleSaveInfo = async () => {
    if (!user?.id) {
      toast({ title: "Erreur", description: "Utilisateur non identifié.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      await updateUser.mutateAsync({
        id: user.id,
        data: { firstname: firstName, lastname: lastName, email },
      });
      toast({ title: "Profil sauvegardé", description: "Vos informations ont été mises à jour." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder le profil.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name ?? "Dr. Jean-Pierre Lukusa";
  const displayEmail = user?.email ?? "admin@dhayaro.cd";
  const displayRole = user?.role ?? "researcher";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et préférences.</p>
      </div>

      <Separator />

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 rounded-full border bg-background p-1 shadow-sm hover:bg-accent"
                onClick={() => toast({ title: "Bientôt disponible", description: "Le changement d'avatar sera disponible prochainement" })}
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground">{displayEmail}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className={roleBadge[displayRole] ?? ""}>
                  {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
                </Badge>
                <Badge variant="outline">
                  <Building2 className="mr-1 h-3 w-3" />
                  Hôpital Central
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">
            <User className="mr-2 h-4 w-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="mr-2 h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* ── Informations ───────────────────────────────────── */}
        <TabsContent value="info">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations de contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nom Complet</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Téléphone</Label>
                    <Input
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-dept">Département</Label>
                    <Input
                      id="profile-dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveInfo} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations du Compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                  <p className="font-medium capitalize">{displayRole}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Établissement</p>
                  <p className="font-medium">Hôpital Central</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membre Depuis</p>
                  <p className="font-medium">15 Janvier 2024</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dernière Connexion</p>
                  <p className="font-medium">12 Juillet 2026, 10:30</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Activité ───────────────────────────────────────── */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivity.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 rounded-md px-3 py-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {timeAgo(entry.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Préférences ────────────────────────────────────── */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>Personnalisez votre expérience utilisateur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select value={prefLanguage} onValueChange={setPrefLanguage}>
                    <SelectTrigger>
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
                  <Select value={prefTimezone} onValueChange={setPrefTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fuseau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Kinshasa">Africa/Kinshasa (UTC+1/+2)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                      <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Éléments par Page</Label>
                  <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nombre d'éléments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications par Email</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email
                    </p>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mode Sombre</p>
                    <p className="text-sm text-muted-foreground">
                      Activer le thème sombre pour l'interface
                    </p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveInfo} disabled={saving}>
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
