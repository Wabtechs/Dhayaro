import Link from 'next/link'

const sections = [
  {
    id: 'a-propos',
    title: 'À propos',
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Dhayaro est une application PWA (Progressive Web App) médicale conçue pour la gestion des dossiers cliniques
          dans les hôpitaux de la République Démocratique du Congo. Elle fonctionne en mode <strong>offline-first</strong>,
          permettant une utilisation continue même en l&apos;absence de connexion internet.
        </p>
      </>
    ),
  },
  {
    id: 'architecture',
    title: 'Architecture',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          L&apos;application suit une architecture moderne full-stack avec séparation claire des responsabilités.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-2">Frontend</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Next.js 15 (App Router) + React 19</li>
              <li>Tailwind CSS v4 + shadcn/ui</li>
              <li>Zustand (état global + auth)</li>
              <li>TanStack Query v5 (état serveur)</li>
              <li>TypeScript strict</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400 mb-2">Backend</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Next.js API Routes (serverless)</li>
              <li>Drizzle ORM + PostgreSQL (Neon)</li>
              <li>JWT auth (jose) + bcrypt</li>
              <li>33 endpoints RESTful</li>
              <li>RBAC multi-rôle</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'structure',
    title: 'Structure du projet',
    content: (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
{`src/
  app/
    (app)/           → routes authentifiées
    (auth)/          → routes publiques
    api/v1/          → 33 endpoints API
  views/             → composants page
  components/
    ui/              → shadcn/ui primitives
    layout/          → app-shell, sidebar, header
  hooks/             → TanStack Query hooks
  store/             → Zustand (app + auth)
  services/          → ApiClient
  lib/               → auth, db, schema, seed, utils
  types/             → interfaces TypeScript`}
      </pre>
    ),
  },
  {
    id: 'roles',
    title: 'Rôles utilisateur',
    content: (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Rôle</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Niveau</th>
              <th className="text-left py-2 font-semibold text-gray-900 dark:text-gray-100">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-400">
            {[
              ['super_admin', '100', 'Super Administrateur — accès complet multi-établissement'],
              ['admin', '80', 'Administrateur — gestion utilisateurs, établissements, audit'],
              ['specialist', '70', 'Médecin Spécialiste — valide diagnostics, examens labo'],
              ['doctor', '60', 'Médecin Généraliste — consultations, prescriptions, diagnostics'],
              ['pharmacist', '50', 'Pharmacien — dispensation des médicaments'],
              ['laboratory', '50', 'Laborantin — examens de laboratoire, résultats'],
              ['nurse', '40', 'Infirmier(ère) — triage, soins, hospitalisation'],
              ['accountant', '35', 'Comptable — rapports financiers'],
              ['archivist', '30', 'Archiviste — gestion des archives'],
              ['receptionist', '25', 'Réceptionniste — accueil, file d\'attente'],
              ['patient', '10', 'Patient — accès à son propre dossier'],
            ].map(([role, level, desc]) => (
              <tr key={role} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 font-mono text-gray-900 dark:text-gray-100">{role}</td>
                <td className="py-2 pr-4">{level}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'api',
    title: 'Endpoints API',
    content: (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Méthode</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Endpoint</th>
              <th className="text-left py-2 font-semibold text-gray-900 dark:text-gray-100">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-400">
            {[
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
              ['GET/PUT', '/api/v1/audit-fonc', 'Audit fonctionnel'],
              ['GET/POST', '/api/v1/sync/pull', 'Sync descente'],
              ['GET/POST', '/api/v1/sync/push', 'Sync montée'],
            ].map(([method, endpoint, desc]) => (
              <tr key={endpoint} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                    method === 'GET' || method === 'GET/PUT' || method === 'GET/PUT/DELETE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>{method}</span>
                </td>
                <td className="py-2 pr-4 font-mono text-gray-900 dark:text-gray-100 text-xs">{endpoint}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'db',
    title: 'Base de données',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Schéma PostgreSQL avec 17 tables, UUIDs comme clés primaires, soft-delete via <code className="text-indigo-600 dark:text-indigo-400">is_active</code>,
          timestamps <code className="text-indigo-600 dark:text-indigo-400">created_at</code> / <code className="text-indigo-600 dark:text-indigo-400">updated_at</code> sur chaque table.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'users', 'patients', 'consultations', 'diagnostics',
            'treatments', 'prescriptions', 'lab_exams',
            'lab_categories', 'care_episodes', 'episode_entities',
            'clinical_cases', 'diseases', 'therapeutic_protocols',
            'documents', 'notifications', 'facilities',
            'queue_entries',
          ].map(table => (
            <div key={table} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300">
              {table}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'installation',
    title: 'Installation & développement',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Prérequis</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Node.js 20+</li>
            <li>PostgreSQL (Neon en prod, local en dev)</li>
            <li>npm ou yarn</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Installation</h4>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`git clone <repo>
cd dhayaro
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
npm run dev`}
          </pre>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Commandes principales</h4>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`npm run dev        → Développement local
npm run build      → Build production
npm run lint       → ESLint
npm run typecheck  → TypeScript strict`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: 'test-accounts',
    title: 'Comptes de test',
    content: (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Rôle</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">Email</th>
              <th className="text-left py-2 font-semibold text-gray-900 dark:text-gray-100">Mot de passe</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-400">
            {[
              ['Admin', 'admin@dhayaro.cd', 'admin123'],
              ['Super Admin', 'superadmin@dhayaro.cd', 'admin123'],
              ['Réceptionniste', 'reception@dhayaro.cd', 'dhayaro123'],
              ['Médecin (Kabongo)', 'dr.kabongo@dhayaro.cd', 'doctor123'],
              ['Infirmier (Mohamed)', 'nurse.mohamed@dhayaro.cd', 'nurse123'],
              ['Laborantin', 'lab.joseph@dhayaro.cd', 'dhayaro123'],
              ['Pharmacien', 'pharm.beatrice@dhayaro.cd', 'dhayaro123'],
            ].map(([role, email, password]) => (
              <tr key={email} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">{role}</td>
                <td className="py-2 pr-4 font-mono">{email}</td>
                <td className="py-2 font-mono">{password}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
          Voir la liste complète sur la page <Link href="/test-accounts" className="text-indigo-600 dark:text-indigo-400 hover:underline">Comptes de test</Link>.
        </p>
      </div>
    ),
  },
  {
    id: 'deploiement',
    title: 'Déploiement',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Déployé sur Vercel (frontend statique + API routes comme serverless functions).
          Base de données PostgreSQL via Neon.
        </p>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Variables d&apos;environnement</h4>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=https://...`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: 'conventions',
    title: 'Conventions de code',
    content: (
      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {[
          'TypeScript strict — pas de ignoreBuildErrors',
          'API snake_case → frontend camelCase via transformKeys()',
          'Fichiers en kebab-case, composants en PascalCase',
          'Pas de commentaires dans le code sauf demande explicite',
          'Zustand selecteurs : useStore((s) => s.field), jamais de destructuring',
          'Token JWT stocké dans dhayaro_token (localStorage + cookie)',
          'UI en français, code et commentaires en anglais',
          'UUID comme clés primaires, soft-delete via is_active',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dhayaro Docs</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://dhayaro.vercel.app"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Retour à l&apos;app
            </a>
            <a
              href="/login"
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Connexion
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Documentation du projet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            PWA médicale pour la gestion des dossiers cliniques en RDC
          </p>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                {s.title}
              </h3>
              {s.content}
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400 dark:text-gray-600">
          Dhayaro &copy; {new Date().getFullYear()} — Documentation technique du projet
        </footer>
      </div>
    </div>
  )
}
