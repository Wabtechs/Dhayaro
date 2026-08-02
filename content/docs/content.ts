export const docsContent: { id: string; title: string; docKey: string; markdown: string }[] = [
  {
    id: 'a-propos',
    title: 'À propos',
    docKey: 'docs-a-propos',
    markdown: `Dhayaro est une application PWA (Progressive Web App) médicale conçue pour la gestion des dossiers cliniques dans les hôpitaux de la République Démocratique du Congo. Elle fonctionne en mode **offline-first**, permettant une utilisation continue même en l'absence de connexion internet.`,
  },
  {
    id: 'architecture',
    title: 'Architecture',
    docKey: 'docs-architecture',
    markdown: `L'application suit une architecture moderne full-stack avec séparation claire des responsabilités.

**Frontend:** Next.js 15 (App Router) + React 19, Tailwind CSS v4 + shadcn/ui, Zustand (état global + auth), TanStack Query v5 (état serveur), TypeScript strict.

**Backend:** Next.js API Routes (serverless), Drizzle ORM + PostgreSQL (Neon), JWT auth (jose) + bcrypt, 33 endpoints RESTful, RBAC multi-rôle.`,
  },
  {
    id: 'structure',
    title: 'Structure du projet',
    docKey: 'docs-structure',
    markdown: `\`\`\`
src/
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
  types/             → interfaces TypeScript
\`\`\``,
  },
  {
    id: 'roles',
    title: 'Rôles utilisateur',
    docKey: 'docs-roles',
    markdown: `| Rôle | Niveau | Description |
|------|--------|-------------|
| super_admin | 100 | Super Administrateur — accès complet multi-établissement |
| admin | 80 | Administrateur — gestion utilisateurs, établissements, audit |
| specialist | 70 | Médecin Spécialiste — valide diagnostics, examens labo |
| doctor | 60 | Médecin Généraliste — consultations, prescriptions, diagnostics |
| pharmacist | 50 | Pharmacien — dispensation des médicaments |
| laboratory | 50 | Laborantin — examens de laboratoire, résultats |
| nurse | 40 | Infirmier(ère) — triage, soins, hospitalisation |
| accountant | 35 | Comptable — rapports financiers |
| archivist | 30 | Archiviste — gestion des archives |
| receptionist | 25 | Réceptionniste — accueil, file d'attente |
| patient | 10 | Patient — accès à son propre dossier |`,
  },
  {
    id: 'api',
    title: 'Endpoints API',
    docKey: 'docs-api',
    markdown: `| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/auth/login | Connexion utilisateur |
| POST | /api/v1/auth/refresh | Rafraîchir token JWT |
| GET | /api/v1/auth/me | Profil utilisateur connecté |
| POST | /api/v1/auth/patient-login | Connexion patient |
| GET | /api/v1/patients | Liste des patients |
| POST | /api/v1/patients | Créer un patient |
| GET/PUT | /api/v1/patients/[id] | Détail / modifier patient |
| GET | /api/v1/consultations | Liste des consultations |
| POST | /api/v1/consultations | Créer une consultation |
| GET/PUT/DELETE | /api/v1/consultations/[id] | Détail / modifier / annuler consultation |
| GET | /api/v1/diagnostics | Liste des diagnostics |
| POST | /api/v1/diagnostics | Poser un diagnostic |
| GET/PUT/DELETE | /api/v1/diagnostics/[id] | Détail / modifier / supprimer diagnostic |
| GET | /api/v1/treatments | Liste des traitements |
| POST | /api/v1/treatments | Prescrire un traitement |
| GET/PUT/DELETE | /api/v1/treatments/[id] | Détail / modifier / supprimer traitement |
| GET | /api/v1/lab/exams | Liste des examens labo |
| POST | /api/v1/lab/exams | Créer un examen |
| GET/PUT/DELETE | /api/v1/lab/exams/[id] | Détail / modifier / supprimer examen |
| GET | /api/v1/dashboard/stats | Statisques tableau de bord |
| GET | /api/v1/queue | File d'attente |
| POST | /api/v1/queue | Ajouter à la file |
| GET | /api/v1/users | Liste des utilisateurs |
| POST | /api/v1/users | Créer un utilisateur |
| GET/PUT | /api/v1/users/[id] | Détail / modifier utilisateur |
| GET | /api/v1/documents | Liste des documents |
| POST | /api/v1/documents | Créer un document |
| GET | /api/v1/notifications | Liste des notifications |
| GET | /api/v1/care-episodes | Épisodes de soins |
| GET | /api/v1/settings | Paramètres |
| POST | /api/v1/sync/pull | Sync descente |
| POST | /api/v1/sync/push | Sync montée |`,
  },
  {
    id: 'db',
    title: 'Base de données',
    docKey: 'docs-db',
    markdown: `Schéma PostgreSQL avec 17 tables, UUIDs comme clés primaires, soft-delete via \`is_active\`, timestamps \`created_at\` / \`updated_at\` sur chaque table.

- facilities
- users
- patients
- consultations
- diagnostics
- treatments
- prescriptions
- lab_exams
- lab_categories
- care_episodes
- episode_entities
- clinical_cases
- diseases
- therapeutic_protocols
- documents
- notifications
- queue_entries
- help_images`,
  },
  {
    id: 'installation',
    title: 'Installation & développement',
    docKey: 'docs-installation',
    markdown: `### Prérequis

- Node.js 20+
- PostgreSQL (Neon en prod, local en dev)
- npm ou yarn

### Installation

\`\`\`
git clone <repo>
cd dhayaro
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
npm run dev
\`\`\`

### Commandes principales

\`\`\`
npm run dev        → Développement local
npm run build      → Build production
npm run lint       → ESLint
npm run typecheck  → TypeScript strict
\`\`\``,
  },
  {
    id: 'test-accounts',
    title: 'Comptes de test',
    docKey: 'docs-test-accounts',
    markdown: `| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@dhayaro.cd | admin123 |
| Super Admin | superadmin@dhayaro.cd | admin123 |
| Réceptionniste | reception@dhayaro.cd | dhayaro123 |
| Médecin (Kabongo) | dr.kabongo@dhayaro.cd | doctor123 |
| Infirmier (Mohamed) | nurse.mohamed@dhayaro.cd | nurse123 |
| Laborantin | lab.joseph@dhayaro.cd | dhayaro123 |
| Pharmacien | pharm.beatrice@dhayaro.cd | dhayaro123 |

Voir la liste complète sur la page [Comptes de test](/test-accounts).`,
  },
  {
    id: 'deploiement',
    title: 'Déploiement',
    docKey: 'docs-deploiement',
    markdown: `Déployé sur Vercel (frontend statique + API routes comme serverless functions). Base de données PostgreSQL via Neon.

### Variables d'environnement

\`\`\`
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=https://...
\`\`\``,
  },
  {
    id: 'conventions',
    title: 'Conventions de code',
    docKey: 'docs-conventions',
    markdown: `- TypeScript strict — pas de ignoreBuildErrors
- API snake_case → frontend camelCase via transformKeys()
- Fichiers en kebab-case, composants en PascalCase
- Pas de commentaires dans le code sauf demande explicite
- Zustand selecteurs : \`useStore((s) => s.field)\`, jamais de destructuring
- Token JWT stocké dans \`dhayaro_token\` (localStorage + cookie)
- UI en français, code et commentaires en anglais
- UUID comme clés primaires, soft-delete via \`is_active\``,
  },
]
