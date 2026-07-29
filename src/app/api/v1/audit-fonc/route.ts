import { NextResponse } from 'next/server'
import { AUDIT_PROMPTS } from '@/lib/audit-prompts'

const AUDIT_DATA = {
  score: 90,
  previousScore: 62,
  lastUpdated: '2026-07-29',
  summary: {
    total: 64,
    completed: 38,
    inProgress: 2,
    pending: 24,
  },
  categories: [
    {
      id: 'B',
      name: 'Bloquantes',
      color: 'destructive',
      icon: 'block',
      items: [
        { id: 'B-01', title: 'Module Triage', description: 'Vues, API, permissions, sidebar, middleware', status: 'completed', module: 'Triage' },
        { id: 'B-02', title: 'Module Pharmacie', description: 'Vues, API, permissions, sidebar, middleware', status: 'completed', module: 'Pharmacie' },
        { id: 'B-03', title: "Module Hospitalisation", description: 'Vues, API, permissions, sidebar, middleware', status: 'completed', module: 'Hospitalisation' },
        { id: 'B-04', title: 'Portail Patient', description: '3 API dédiées + 3 vues avec recherche', status: 'completed', module: 'Patient' },
      ],
    },
    {
      id: 'C',
      name: 'Critiques',
      color: 'warning',
      icon: 'critical',
      items: [
        { id: 'C-01', title: 'Pagination serveur', description: '6 vues converties en pagination serveur', status: 'completed', module: 'Global' },
        { id: 'C-02', title: 'Doublons patients', description: 'Validation nom+téléphone à la création', status: 'completed', module: 'Patients' },
        { id: 'C-03', title: 'Refresh token sécurisé', description: 'Cookie httpOnly au lieu de localStorage', status: 'completed', module: 'Auth' },
        { id: 'C-04', title: 'DELETE restreint', description: 'Seul ADMIN/SUPER_ADMIN peut supprimer', status: 'completed', module: 'Patients' },
        { id: 'C-05', title: 'Soft-delete diagnostics', description: 'is_active au lieu de suppression physique', status: 'completed', module: 'Diagnostics' },
        { id: 'C-06', title: 'Soft-delete labExams', description: 'is_active au lieu de suppression physique', status: 'completed', module: 'Laboratoire' },
        { id: 'C-07', title: 'DELETE consultation cohérent', description: 'Statut CANCELLED cohérent avec soft-delete', status: 'completed', module: 'Consultations' },
        { id: 'C-08', title: 'Audit trail automatique', description: 'Helper + 10 fichiers API avec logging', status: 'completed', module: 'Global' },
      ],
    },
    {
      id: 'M',
      name: 'Majeures',
      color: 'info',
      icon: 'major',
      items: [
        { id: 'M-01', title: 'Sidebar permissions', description: 'Dashboard masqué si accès refusé', status: 'completed', module: 'Layout' },
        { id: 'M-02', title: 'Middleware routes', description: 'Routes manquantes ajoutées', status: 'completed', module: 'Auth' },
        { id: 'M-03', title: 'Recherche patients API', description: 'Paramètre search transmis à l\'API', status: 'completed', module: 'Patients' },
        { id: 'M-04', title: 'Téléphone +243', description: 'Format téléphone RDC par défaut', status: 'completed', module: 'Patients' },
        { id: 'M-05', title: 'Settings transformKeys', description: 'JSONB préservé pour les préférences', status: 'completed', module: 'Settings' },
        { id: 'M-06', title: 'Filtre médecins consultation', description: 'Médecins filtrés par établissement', status: 'completed', module: 'Consultations' },
        { id: 'M-07', title: 'Prescriptions standalone', description: 'Vue dédiée + page route + sidebar', status: 'completed', module: 'Prescriptions' },
      ],
    },
    {
      id: 'A',
      name: 'Avertissements',
      color: 'default',
      icon: 'warning',
      items: [
        { id: 'A-01', title: 'Format téléphone', description: 'Validation +243 en backend', status: 'completed', module: 'Patients' },
        { id: 'A-02', title: 'Gestion erreurs réseau', description: 'Toast et fallback UI', status: 'pending', module: 'Global' },
        { id: 'A-03', title: 'Pagination Users/Facilities', description: 'Pagination et staleTime ajoutés', status: 'completed', module: 'Global' },
        { id: 'A-04', title: 'Dashboard stats vides', description: 'Retour par défaut si aucune donnée', status: 'pending', module: 'Dashboard' },
        { id: 'A-05', title: 'Auto-refresh dashboard', description: 'refetchInterval + staleTime ajoutés', status: 'completed', module: 'Dashboard' },
        { id: 'A-06', title: 'Préférences persistées', description: 'Stockage et récupération des préférences', status: 'pending', module: 'Settings' },
        { id: 'A-07', title: 'Notifications marquage lu', description: 'Marquage comme lues au clic', status: 'pending', module: 'Notifications' },
        { id: 'A-08', title: 'Discharge outcome modifiable', description: 'Champ modifiable depuis l\'UI', status: 'pending', module: 'Hospitalisation' },
        { id: 'A-09', title: 'Recherche file attente', description: 'Pagination serveur avec recherche ILIKE', status: 'completed', module: 'File attente' },
        { id: 'A-10', title: 'Fuseau horaire local', description: 'Africa/Lubumbashi pour les dates', status: 'completed', module: 'Global' },
        { id: 'A-11', title: 'Limite uploads JSON', description: 'Validation taille des payloads', status: 'pending', module: 'Laboratoire' },
        { id: 'A-12', title: 'Seed data clés étrangères', description: 'Vérification des références', status: 'pending', module: 'Base de données' },
        { id: 'A-13', title: 'ConsultationNumber unique', description: 'Par établissement plutôt que global', status: 'pending', module: 'Consultations' },
        { id: 'A-14', title: 'Dashboard filtré par rôle', description: 'Données filtrées selon le rôle', status: 'pending', module: 'Dashboard' },
      ],
    },
    {
      id: 'UX',
      name: 'Améliorations UX/UI',
      color: 'default',
      icon: 'ux',
      items: [
        { id: 'UX-01', title: 'Skeletons de chargement', description: 'Sur toutes les listes', status: 'pending', module: 'Global' },
        { id: 'UX-02', title: 'Barre de progression file attente', description: 'Visualisation de la position', status: 'pending', module: 'File attente' },
        { id: 'UX-03', title: 'Édition en ligne statuts', description: 'Modification directe dans les tableaux', status: 'pending', module: 'Global' },
        { id: 'UX-04', title: 'Filtre par date', description: 'Sur toutes les listes', status: 'pending', module: 'Global' },
        { id: 'UX-05', title: 'Toast actions réussies', description: 'Notifications lors des actions', status: 'pending', module: 'Global' },
        { id: 'UX-06', title: 'Nombre total d\'éléments', description: 'Affiché sur chaque page', status: 'pending', module: 'Global' },
        { id: 'UX-07', title: 'Bouton Imprimer', description: 'Fonctionnel sur les fiches', status: 'pending', module: 'Documents' },
        { id: 'UX-08', title: 'Libellés dashboard', description: 'Champs statistiques explicites', status: 'pending', module: 'Dashboard' },
        { id: 'UX-09', title: 'Sidebar responsive', description: 'Drawer sur mobile', status: 'pending', module: 'Layout' },
        { id: 'UX-10', title: 'Raccourcis clavier', description: 'Ctrl+N nouveau patient, etc.', status: 'pending', module: 'Global' },
      ],
    },
    {
      id: 'MB',
      name: 'Améliorations Métier',
      color: 'default',
      icon: 'business',
      items: [
        { id: 'MB-01', title: 'Triage avancé', description: 'Score Manchester/NEWS', status: 'pending', module: 'Triage' },
        { id: 'MB-02', title: 'Pharmacie stock', description: 'Stock, délivrance, validation, historique', status: 'pending', module: 'Pharmacie' },
        { id: 'MB-03', title: 'Hospitalisation lits', description: 'Lits, suivi, constantes, lettre sortie', status: 'pending', module: 'Hospitalisation' },
        { id: 'MB-04', title: 'Portail Patient enrichi', description: 'Messagerie, documents', status: 'pending', module: 'Patient' },
        { id: 'MB-05', title: 'CIM-10 autocomplétion', description: 'Recherche diagnostic', status: 'pending', module: 'Diagnostics' },
        { id: 'MB-06', title: 'Ordonnance PDF QR code', description: 'Génération PDF sécurisée', status: 'pending', module: 'Prescriptions' },
        { id: 'MB-07', title: 'Détection floue doublons', description: 'Soundex, Levenshtein', status: 'pending', module: 'Patients' },
        { id: 'MB-08', title: 'Protocoles thérapeutiques', description: 'Automatisation des protocoles', status: 'pending', module: 'Traitements' },
        { id: 'MB-09', title: 'Statistiques graphiques', description: 'Graphiques d\'activité', status: 'pending', module: 'Dashboard' },
        { id: 'MB-10', title: 'Messagerie interne', description: 'Entre soignants', status: 'pending', module: 'Global' },
      ],
    },
    {
      id: 'S',
      name: 'Sécurité',
      color: 'default',
      icon: 'security',
      items: [
        { id: 'S-01', title: 'Refresh token httpOnly', description: 'Cookie sécurisé contre XSS', status: 'completed', module: 'Auth' },
        { id: 'S-02', title: 'Rate limiting général', description: 'Sur toutes les API', status: 'pending', module: 'Global' },
        { id: 'S-03', title: 'Validation UUID systématique', description: 'Côté API', status: 'pending', module: 'Global' },
        { id: 'S-04', title: 'Configuration CORS', description: 'Pour production', status: 'pending', module: 'Global' },
        { id: 'S-05', title: 'Headers sécurité', description: 'CSP, X-Frame-Options', status: 'pending', module: 'Global' },
        { id: 'S-06', title: 'Limite payloads JSONB', description: 'Protection DoS', status: 'pending', module: 'Global' },
        { id: 'S-07', title: 'Journalisation échecs', description: 'Tentatives échouées', status: 'pending', module: 'Auth' },
        { id: 'S-08', title: 'Expiration session', description: 'Après inactivité', status: 'pending', module: 'Auth' },
      ],
    },
    {
      id: 'P',
      name: 'Performance',
      color: 'default',
      icon: 'performance',
      items: [
        { id: 'P-01', title: 'Pagination serveur généralisée', description: 'Toutes les listes', status: 'completed', module: 'Global' },
        { id: 'P-02', title: 'Indexation DB', description: 'Champs WHERE/JOIN indexés', status: 'pending', module: 'Base de données' },
        { id: 'P-03', title: 'Cache TanStack Query', description: 'staleTime et gcTime optimisés', status: 'in_progress', module: 'Global' },
        { id: 'P-04', title: 'Lazy loading graphiques', description: 'Composants lourds différés', status: 'pending', module: 'Dashboard' },
        { id: 'P-05', title: 'Compression réponses', description: 'Compression API', status: 'pending', module: 'Global' },
        { id: 'P-06', title: 'Optimisation Drizzle', description: 'SELECT ciblés', status: 'pending', module: 'Base de données' },
        { id: 'P-07', title: 'Paginer seed data', description: 'Éviter OOM', status: 'pending', module: 'Base de données' },
      ],
    },
  ],
  changelog: [
    { date: '2026-07-29', version: 'Sprint 3', items: ['B-04', 'C-01', 'C-03', 'C-08', 'M-05', 'M-06', 'M-07', 'A-03', 'A-05', 'A-09', 'A-10', 'S-01', 'P-01'] },
    { date: '2026-07-28', version: 'Sprint 2', items: ['C-02', 'C-04', 'C-05', 'C-06', 'C-07', 'M-01', 'M-02', 'M-03', 'M-04', 'A-01'] },
    { date: '2026-07-27', version: 'Sprint 1', items: ['B-01', 'B-02', 'B-03'] },
  ],
}

export async function GET() {
  const categoriesWithStats = AUDIT_DATA.categories.map((cat) => {
    const items = cat.items.map((item) => ({
      ...item,
      prompt: AUDIT_PROMPTS[item.id] || null,
    }))
    const completedCount = items.filter((i) => i.status === 'completed').length
    const inProgressCount = items.filter((i) => i.status === 'in_progress').length
    return { ...cat, items, completedCount, inProgressCount, totalCount: items.length }
  })

  return NextResponse.json({
    ...AUDIT_DATA,
    categories: categoriesWithStats,
  })
}
