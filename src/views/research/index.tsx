import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockClinicalCases, mockChartData } from "@/lib/mock-data";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { RechartsChart } from "@/components/charts/recharts-chart";
import {
  FlaskConical,
  BookOpen,
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Plus,
  Users,
  Search,
  ArrowUpRight,
} from "lucide-react";

const recentAnalyses = [
  {
    id: 1,
    title: "Étude comparative des traitements cardiovasculaires",
    facility: "Hôpital Central",
    date: "2026-07-10",
    status: "En cours",
    type: "Étude",
  },
  {
    id: 2,
    title: "Analyse de l'efficacité des antibiotiques",
    facility: "Clinique Sainte-Marie",
    date: "2026-07-08",
    status: "Terminé",
    type: "Recherche",
  },
  {
    id: 3,
    title: "Recherche sur les facteurs de risque diabète",
    facility: "Centre Médical du Nord",
    date: "2026-07-05",
    status: "En cours",
    type: "Analyse",
  },
  {
    id: 4,
    title: "Étude épidémiologique COVID-19",
    facility: "Hôpital Central",
    date: "2026-07-01",
    status: "En révision",
    type: "Étude",
  },
  {
    id: 5,
    title: "Analyse des effets secondaires vaccins",
    facility: "Clinique Sainte-Marie",
    date: "2026-06-28",
    status: "Terminé",
    type: "Recherche",
  },
];

const activeStudies = [
  {
    id: 1,
    title: "Étude cardiovasculaire multicentrique",
    description:
      "Analyse des facteurs de risque cardiovasculaire dans une population de 5000 patients sur 3 centres hospitaliers.",
    progress: 68,
    team: ["Dr. Jean-Pierre Lukusa", "Dr. Patrice Kabongo", "Dr. Solange Ngoy"],
  },
  {
    id: 2,
    title: "Recherche sur le diabète de type 2",
    description:
      "Étude longitudinale de l'impact des nouvelles thérapies sur la glycémie chez les patients diabétiques.",
    progress: 42,
    team: ["Dr. Youcef Hamidi", "Dr. Nadia Boudiaf"],
  },
  {
    id: 3,
    title: "Analyse de l'efficacité antibiotiques",
    description:
      "Étude comparative de l'efficacité des nouvelles classes d'antibiotiques contre les infections résistantes.",
    progress: 85,
    team: ["Dr. Ahmed Kaci", "Dr. Leila Merah", "Dr. Omar Tlemçani", "Dr. Houda Benmoussa"],
  },
];

const statusColor: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-800",
  "Terminé": "bg-green-100 text-green-800",
  "En révision": "bg-yellow-100 text-yellow-800",
};

const typeColor: Record<string, string> = {
  Étude: "bg-purple-100 text-purple-800",
  Recherche: "bg-indigo-100 text-indigo-800",
  Analyse: "bg-teal-100 text-teal-800",
};

export default function ResearchPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord Chercheurs</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name ?? "Chercheur"}. Voici un aperçu de vos recherches et analyses.
        </p>
      </div>

      <Separator />

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cas Analysés</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockClinicalCases.length}</div>
            <p className="text-xs text-muted-foreground">+12% par rapport au mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recherches Actives</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 en cours, 1 en révision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Publications</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">3 acceptées, 4 en soumission</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Cas par Établissement
            </CardTitle>
            <CardDescription>Répartition des cas cliniques analysés</CardDescription>
          </CardHeader>
          <CardContent>
            <RechartsChart
              type="bar"
              data={mockChartData.casesByFacility}
              dataKey="value"
              xAxisKey="name"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Évolution Mensuelle
            </CardTitle>
            <CardDescription>Nombre de cas analysés par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <RechartsChart
              type="line"
              data={mockChartData.casesByMonth}
              dataKey="value"
              xAxisKey="name"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => toast({ title: "Nouvelle étude", description: "La création d'étude sera bientôt disponible." })}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Étude
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Export en cours...", description: "Le fichier sera bientôt disponible." })}>
            <Download className="mr-2 h-4 w-4" />
            Exporter Données
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Génération en cours...", description: "Le rapport sera bientôt disponible." })}>
            <FileText className="mr-2 h-4 w-4" />
            Générer Rapport
          </Button>
        </CardContent>
      </Card>

      {/* Recent Analyses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analyses Récentes</CardTitle>
          <CardDescription>Vos dernières analyses et recherches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Titre</th>
                  <th className="pb-3 font-medium">Établissement</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{analysis.title}</td>
                    <td className="py-3 text-muted-foreground">{analysis.facility}</td>
                    <td className="py-3 text-muted-foreground">{analysis.date}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={statusColor[analysis.status] ?? ""}>
                        {analysis.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary" className={typeColor[analysis.type] ?? ""}>
                        {analysis.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Studies */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Études Actives</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {activeStudies.map((study) => (
            <Card key={study.id}>
              <CardHeader>
                <CardTitle className="text-base">{study.title}</CardTitle>
                <CardDescription className="line-clamp-2">{study.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{study.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${study.progress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Équipe</p>
                  <div className="flex flex-wrap gap-2">
                    {study.team.map((member) => (
                      <Badge key={member} variant="secondary" className="text-xs">
                        <Users className="mr-1 h-3 w-3" />
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => toast({ title: "Bientôt disponible", description: "La vue détaillée des études sera disponible prochainement" })}
                >
                  Voir détails
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
