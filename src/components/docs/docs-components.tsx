'use client'

import { HelpImageUpload } from '@/components/help/help-image-upload'

export function DocSection({ id, title, docKey, children }: { id: string; title: string; docKey: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        {title}
      </h3>
      {children}
      <HelpImageUpload location={docKey} altText={`Illustration : ${title}`} />
    </section>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      {children}
    </div>
  )
}

export function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-2">{title}</h4>
      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const cls = colorMap[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}>{method}</span>
  )
}

const apiEndpoints: [string, string, string][] = [
  ['POST', '/api/v1/auth/login', 'Connexion utilisateur'],
  ['POST', '/api/v1/auth/refresh', 'Rafraîchir token JWT'],
  ['GET', '/api/v1/auth/me', 'Profil utilisateur connecté'],
  ['POST', '/api/v1/auth/patient-login', 'Connexion patient'],
  ['GET', '/api/v1/patients', 'Liste des patients'],
  ['POST', '/api/v1/patients', 'Créer un patient'],
  ['GET/PUT', '/api/v1/patients/[id]', 'Détail / modifier patient'],
  ['GET', '/api/v1/consultations', 'Liste des consultations'],
  ['POST', '/api/v1/consultations', 'Créer une consultation'],
  ['GET/PUT/DELETE', '/api/v1/consultations/[id]', 'Détail / modifier / annuler consultation'],
  ['GET', '/api/v1/diagnostics', 'Liste des diagnostics'],
  ['POST', '/api/v1/diagnostics', 'Poser un diagnostic'],
  ['GET/PUT/DELETE', '/api/v1/diagnostics/[id]', 'Détail / modifier / supprimer diagnostic'],
  ['GET', '/api/v1/treatments', 'Liste des traitements'],
  ['POST', '/api/v1/treatments', 'Prescrire un traitement'],
  ['GET/PUT/DELETE', '/api/v1/treatments/[id]', 'Détail / modifier / supprimer traitement'],
  ['GET', '/api/v1/lab/exams', 'Liste des examens labo'],
  ['POST', '/api/v1/lab/exams', 'Créer un examen'],
  ['GET/PUT/DELETE', '/api/v1/lab/exams/[id]', 'Détail / modifier / supprimer examen'],
  ['GET', '/api/v1/dashboard/stats', 'Statistiques tableau de bord'],
  ['GET', '/api/v1/queue', 'File d\'attente'],
  ['POST', '/api/v1/queue', 'Ajouter à la file'],
  ['GET', '/api/v1/users', 'Liste des utilisateurs'],
  ['POST', '/api/v1/users', 'Créer un utilisateur'],
  ['GET/PUT', '/api/v1/users/[id]', 'Détail / modifier utilisateur'],
  ['GET', '/api/v1/documents', 'Liste des documents'],
  ['POST', '/api/v1/documents', 'Créer un document'],
  ['GET', '/api/v1/notifications', 'Liste des notifications'],
  ['GET', '/api/v1/care-episodes', 'Épisodes de soins'],
  ['GET', '/api/v1/settings', 'Paramètres'],
  ['GET/POST', '/api/v1/sync/pull', 'Sync descente'],
  ['GET/POST', '/api/v1/sync/push', 'Sync montée'],
]

export function ApiTable() {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Méthode</th>
            <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Endpoint</th>
            <th className="text-left py-2 font-semibold text-gray-900 dark:text-gray-100">Description</th>
          </tr>
        </thead>
        <tbody>
          {apiEndpoints.map(([method, endpoint, description]) => (
            <tr key={endpoint} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4">
                {method.split('/').map((m) => <span key={m} className="mr-1"><MethodBadge method={m} /></span>)}
              </td>
              <td className="py-2 pr-4 font-mono text-gray-900 dark:text-gray-100 text-xs">{endpoint}</td>
              <td className="py-2 text-gray-600 dark:text-gray-400">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
