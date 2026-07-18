'use client'

import {
  FileBarChart,
  Users,
  Stethoscope,
  TestTube,
  Pill,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const reports = [
  {
    id: 'patients',
    title: 'Rapport Patients',
    description: 'Statistiques démographiques, admissions et évolution de la patientèle.',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  },
  {
    id: 'consultations',
    title: 'Rapport Consultations',
    description: 'Nombre de consultations, motifs fréquents et temps d\'attente moyen.',
    icon: Stethoscope,
    color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
  },
  {
    id: 'laboratory',
    title: 'Rapport Laboratoire',
    description: 'Examens réalisés, délais de rendu et résultats significatifs.',
    icon: TestTube,
    color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
  },
  {
    id: 'treatments',
    title: 'Rapport Traitements',
    description: 'Protocoles thérapeutiques, observance et issues cliniques.',
    icon: Pill,
    color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  },
]

export { ReportsView }
export default function ReportsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground">
            Générez et exportez des rapports d&apos;activité
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                <div className={`rounded-lg p-3 ${report.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Générer
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
