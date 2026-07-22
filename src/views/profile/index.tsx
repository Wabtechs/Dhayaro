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
  Palette,
} from "lucide-react";

const roleBadge: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  admin: "bg-red-100 text-red-800",
  doctor: "bg-blue-100 text-blue-800",
  specialist: "bg-purple-100 text-purple-800",
  nurse: "bg-green-100 text-green-800",
  laboratory: "bg-yellow-100 text-yellow-800",
  pharmacist: "bg-cyan-100 text-cyan-800",
  receptionist: "bg-orange-100 text-orange-800",
  accountant: "bg-gray-100 text-gray-800",
  archivist: "bg-indigo-100 text-indigo-800",
};

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const updateUser = useUpdateUser();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");

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

  const displayName = user?.name ?? "";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ?? "";
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
                  {user?.facility || "Non assigné"}
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
                  <p className="font-medium">{user?.facility || "Non assigné"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membre Depuis</p>
                  <p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dernière Connexion</p>
                  <p className="font-medium">{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}</p>
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
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8" />
                <p>Aucune activité récente</p>
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
