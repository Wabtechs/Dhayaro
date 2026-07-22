import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useClinicalCasesData } from "@/hooks/use-data";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";

const LazyRechartsChart = dynamic(
  () => import('@/components/charts/recharts-chart').then(m => ({ default: m.RechartsChart })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
)
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
    facility: "Hôpital Général de Kinshasa",
    date: "2026-07-10",
    status: "En cours",
    type: "Étude",
  },
  {
    id: 2,
    title: "Analyse de l'efficacité des antibiotiques",
    facility: "Cliniques Universitaires de Kinshasa",
    date: "2026-07-08",
    status: "Terminé",
    type: "Recherche",
  },
  {
    id: 3,
    title: "Recherche sur les facteurs de risque diabète",
    facility: "Clinique Ngaliema",
    date: "2026-07-05",
    status: "En cours",
    type: "Analyse",
  },
  {
    id: 4,
    title: "Étude épidémiologique Ebola",
    facility: "Hôpital Général de Kinshasa",
    date: "2026-07-01",
    status: "En révision",
    type: "Étude",
  },
  {
    id: 5,
    title: "Analyse des effets secondaires vaccins",
    facility: "Clinique Ngaliema",
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
      "Analyse des facteurs de risque cardiovasculaire dans une population de 5000 patients sur 3 centres hospitaliers à Kinshasa.",
    progress: 68,
    team: ["Dr. Patrice Kabongo", "Dr. Clovis Lukusa", "Dr. Grâce Nsenda"],
  },
  {
    id: 2,
    title: "Recherche sur le diabète de type 2",
    description:
      "Étude longitudinale de l'impact des nouvelles thérapies sur la glycémie chez les patients diabétiques.",
    progress: 42,
    team: ["Dr. Espérance Ilunga", "Dr. Cécile Kalonji"],
  },
  {
    id: 3,
    title: "Analyse de l'efficacité antibiotiques",
    description:
      "Étude comparative de l'efficacité des nouvelles classes d'antibiotiques contre les infections résistantes.",
    progress: 85,
    team: ["Dr. Sylvain Kasai", "Dr. Béatrice Ngoy", "Dr. Joseph Tshisekedi", "Dr. Monique Bakonga"],
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
  const { data: casesData } = useClinicalCasesData();

  const casesCount = (casesData as unknown as { items?: unknown[] })?.items?.length ?? 0;

  const casesByFacilityMap = new Map<string, number>();
  const casesByMonthMap = new Map<string, number>();
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  monthNames.forEach(m => casesByMonthMap.set(m, 0));

  const allCases = (casesData as unknown as { items?: Array<{ facilityId?: string; createdAt?: string }> })?.items || [];
  allCases.forEach(c => {
    if (c.facilityId) {
      casesByFacilityMap.set(c.facilityId, (casesByFacilityMap.get(c.facilityId) || 0) + 1);
    }
    if (c.createdAt) {
      const date = new Date(c.createdAt);
      if (!isNaN(date.getTime())) {
        const month = monthNames[date.getMonth()];
        casesByMonthMap.set(month, (casesByMonthMap.get(month) || 0) + 1);
      }
    }
  });
  const casesByFacility = Array.from(casesByFacilityMap.entries()).map(([name, value]) => ({ name, value }));
  const casesByMonth = monthNames.map(name => ({ name, value: casesByMonthMap.get(name) || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord Chercheurs</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name ?? "Chercheur"}. Voici un aperçu de vos recherches et analyses.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cas Analysés</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recherches Actives</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Publications</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
      </div>

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
            <LazyRechartsChart
              type="bar"
              data={casesByFacility}
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
            <LazyRechartsChart
              type="line"
              data={casesByMonth}
              dataKey="value"
              xAxisKey="name"
            />
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Analyses Récentes</CardTitle>
          <CardDescription>Vos dernières analyses et recherches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p>Aucune analyse récente</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Études Actives</h2>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <Search className="h-8 w-8" />
          <p>Aucune étude active</p>
        </div>
      </div>
    </div>
  );
}
