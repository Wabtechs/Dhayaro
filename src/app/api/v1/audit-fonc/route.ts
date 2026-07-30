import { NextResponse, NextRequest } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { AUDIT_PROMPTS } from '@/lib/audit-prompts'
import { getDb } from '@/lib/db'
import { auditHistory } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { eq, desc, sql } from 'drizzle-orm'

const STATIC_DATA = {
  score: 94,
  previousScore: 90,
  lastUpdated: '2026-07-30',
  summary: {
    total: 78,
    completed: 56,
    inProgress: 2,
    pending: 20,
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
        { id: 'C-09', title: 'GET episodeId manquant', description: 'episodeId ajouté dans 5 SELECT manquants', status: 'completed', module: 'API' },
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
        { id: 'M-08', title: 'Cascade épisode auto consultations', description: 'POST consultation crée épisode auto si pas d\'episodeId', status: 'completed', module: 'Consultations' },
        { id: 'M-09', title: 'Cascade annulation → enfants', description: 'Annulation consultation cascade diagnostics/traitements/labExams', status: 'completed', module: 'Consultations' },
        { id: 'M-10', title: 'Cascade POST auto épisode', description: 'Diagnostics, traitements, lab/exams créent épisode auto', status: 'completed', module: 'API' },
      ],
    },
    {
      id: 'D',
      name: 'Documentation',
      color: 'info',
      icon: 'docs',
      items: [
        { id: 'D-01', title: 'Guides utilisateur par rôle', description: '6 guides (Réceptionniste, Médecin, Admin, Infirmier, Laborantin, Pharmacien)', status: 'completed', module: 'Help' },
        { id: 'D-02', title: 'Page /docs publique', description: 'Documentation projet accessible sans auth (architecture, API, DB, rôles, installation)', status: 'completed', module: 'Docs' },
        { id: 'D-03', title: 'Système d\'images aide/docs', description: 'Table help_images + API + upload SUPER_ADMIN + placeholders sur /docs et /help', status: 'completed', module: 'Help' },
        { id: 'D-04', title: 'Lien Documentation login', description: 'Lien vers /docs depuis la page de connexion', status: 'completed', module: 'Docs' },
      ],
    },
    {
      id: 'A',
      name: 'Avertissements',
      color: 'default',
      icon: 'warning',
      items: [
        { id: 'A-01', title: 'Format téléphone', description: 'Validation +243 en backend', status: 'completed', module: 'Patients' },
        { id: 'A-02', title: 'Gestion erreurs réseau', description: 'error.tsx + Toast et fallback UI', status: 'in_progress', module: 'Global' },
        { id: 'A-03', title: 'Pagination Users/Facilities', description: 'Pagination et staleTime ajoutés', status: 'completed', module: 'Global' },
        { id: 'A-04', title: 'Dashboard stats vides', description: 'Retour par défaut si aucune donnée', status: 'completed', module: 'Dashboard' },
        { id: 'A-05', title: 'Auto-refresh dashboard', description: 'refetchInterval + staleTime ajoutés', status: 'completed', module: 'Dashboard' },
        { id: 'A-06', title: 'Préférences persistées', description: 'Stockage et récupération des préférences (API + UI Settings)', status: 'completed', module: 'Settings' },
        { id: 'A-07', title: 'Notifications marquage lu', description: 'Marquage comme lues au clic (API + hooks + store)', status: 'completed', module: 'Notifications' },
        { id: 'A-08', title: 'Discharge outcome modifiable', description: 'Champ modifiable depuis l\'UI', status: 'pending', module: 'Hospitalisation' },
        { id: 'A-09', title: 'Recherche file attente', description: 'Pagination serveur avec recherche ILIKE', status: 'completed', module: 'File attente' },
        { id: 'A-10', title: 'Fuseau horaire local', description: 'Africa/Lubumbashi pour les dates', status: 'completed', module: 'Global' },
        { id: 'A-11', title: 'Limite uploads JSON', description: 'Helper validateJsonBody + MAX_JSON_BYTES (512 KB)', status: 'in_progress', module: 'API' },
        { id: 'A-12', title: 'Seed data clés étrangères', description: 'Vérification des références (toutes OK)', status: 'completed', module: 'Base de données' },
        { id: 'A-13', title: 'ConsultationNumber unique', description: 'UNIQUE + index + génération timestamp+UUID', status: 'completed', module: 'Consultations' },
        { id: 'A-14', title: 'Dashboard filtré par rôle', description: '11 configs rôle-spécifiques', status: 'completed', module: 'Dashboard' },
      ],
    },
    {
      id: 'UX',
      name: 'Améliorations UX/UI',
      color: 'default',
      icon: 'ux',
      items: [
        { id: 'UX-01', title: 'Skeletons de chargement', description: '54/56 vues avec skeletons', status: 'completed', module: 'Global' },
        { id: 'UX-02', title: 'Barre de progression file attente', description: 'Visualisation de la position', status: 'pending', module: 'File attente' },
        { id: 'UX-03', title: 'Édition en ligne statuts', description: 'Modification directe dans les tableaux', status: 'pending', module: 'Global' },
        { id: 'UX-04', title: 'Filtre par date', description: 'Sur toutes les listes', status: 'pending', module: 'Global' },
        { id: 'UX-05', title: 'Toast actions réussies', description: 'Notifications lors des actions (useToast + CRUD)', status: 'completed', module: 'Global' },
        { id: 'UX-06', title: 'Nombre total d\'éléments', description: 'Affiché sur 18 vues listes', status: 'completed', module: 'Global' },
        { id: 'UX-07', title: 'Bouton Imprimer', description: 'Fonctionnel sur les fiches', status: 'pending', module: 'Documents' },
        { id: 'UX-08', title: 'Libellés dashboard', description: '11 rôles avec libellés français explicites', status: 'completed', module: 'Dashboard' },
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
        { id: 'S-03', title: 'Validation UUID systématique', description: 'Toutes les routes [id] + body fields', status: 'completed', module: 'Global' },
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
        { id: 'P-03', title: 'Cache TanStack Query', description: 'staleTime et gcTime optimisés (providers + hooks clés)', status: 'completed', module: 'Global' },
        { id: 'P-04', title: 'Lazy loading graphiques', description: 'Composants lourds différés', status: 'pending', module: 'Dashboard' },
        { id: 'P-05', title: 'Compression réponses', description: 'Compression API', status: 'pending', module: 'Global' },
        { id: 'P-06', title: 'Optimisation Drizzle', description: 'SELECT ciblés', status: 'pending', module: 'Base de données' },
        { id: 'P-07', title: 'Paginer seed data', description: 'Éviter OOM', status: 'pending', module: 'Base de données' },
      ],
    },
  ],
  changelog: [
    { date: '2026-07-30', version: 'Sprint 6', items: ['A-02', 'A-04', 'A-06', 'A-07', 'A-11', 'A-12', 'A-13', 'A-14', 'UX-01', 'UX-05', 'UX-06', 'UX-08', 'S-03', 'P-03'] },
    { date: '2026-07-30', version: 'Sprint 5', items: ['C-09', 'M-08', 'M-09', 'M-10', 'D-01', 'D-02', 'D-03', 'D-04'] },
    { date: '2026-07-29', version: 'Sprint 3', items: ['B-04', 'C-01', 'C-03', 'C-08', 'M-05', 'M-06', 'M-07', 'A-03', 'A-05', 'A-09', 'A-10', 'S-01', 'P-01'] },
    { date: '2026-07-28', version: 'Sprint 2', items: ['C-02', 'C-04', 'C-05', 'C-06', 'C-07', 'M-01', 'M-02', 'M-03', 'M-04', 'A-01'] },
    { date: '2026-07-27', version: 'Sprint 1', items: ['B-01', 'B-02', 'B-03'] },
  ],
}

const GEN_PATH = join(process.cwd(), 'src', 'lib', 'audit-data.generated.json')

function getAllItemsFromStatic() {
  const items: { id: string; categoryId: string; status: string }[] = []
  for (const cat of STATIC_DATA.categories) {
    for (const item of cat.items) {
      items.push({ id: item.id, categoryId: cat.id, status: item.status })
    }
  }
  return items
}

function applyOverrides(allItems: { id: string; categoryId: string; status: string }[], overrides: Map<string, string>) {
  for (const item of allItems) {
    const override = overrides.get(item.id)
    if (override) item.status = override
  }
}

function buildCategoryMap() {
  const map = new Map<string, { id: string; status: string }>()
  for (const cat of STATIC_DATA.categories) {
    for (const item of cat.items) {
      map.set(item.id, { id: item.id, status: item.status })
    }
  }
  return map
}

export async function GET() {
  const db = getDb()
  const staticMap = buildCategoryMap()

  const overrides = new Map<string, string>()
  try {
    const rows = await db
      .select({
        itemId: auditHistory.itemId,
        newStatus: auditHistory.newStatus,
      })
      .from(auditHistory)
      .where(
        sql.raw(`id IN (SELECT DISTINCT ON (item_id) id FROM audit_history ORDER BY item_id, created_at DESC)`)
      )
    for (const row of rows) {
      if (['completed', 'in_progress', 'pending'].includes(row.newStatus)) {
        overrides.set(row.itemId, row.newStatus)
      }
    }
  } catch {}

  let categories = STATIC_DATA.categories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      status: overrides.get(item.id) || item.status,
    })),
  }))

  let changelog = [...STATIC_DATA.changelog]

  if (existsSync(GEN_PATH)) {
    try {
      const raw = readFileSync(GEN_PATH, 'utf-8')
      const gen: any = JSON.parse(raw)
      if (Array.isArray(gen.categories)) {
        for (const genCat of gen.categories) {
          const idx = categories.findIndex((c: any) => c.id === genCat.id)
          if (idx >= 0) {
            categories[idx] = genCat
          } else {
            categories.push(genCat)
          }
        }
      }
      if (Array.isArray(gen.changelog)) {
        changelog = [...gen.changelog, ...changelog]
      }
      if (gen.lastUpdated) { /* don't override */ }
    } catch {}
  }

  const categoriesWithStats = categories.map((cat: any) => {
    const items = (cat.items || []).map((item: any) => ({
      ...item,
      prompt: AUDIT_PROMPTS[item.id] || null,
    }))
    const completedCount = items.filter((i: any) => i.status === 'completed').length
    const inProgressCount = items.filter((i: any) => i.status === 'in_progress').length
    return { ...cat, items, completedCount, inProgressCount, totalCount: items.length }
  })

  const allItems = categoriesWithStats.flatMap((c: any) => c.items || [])
  const totalCompleted = allItems.filter((i: any) => i.status === 'completed').length
  const totalInProgress = allItems.filter((i: any) => i.status === 'in_progress').length
  const totalPending = allItems.filter((i: any) => i.status === 'pending').length
  const total = allItems.length
  const score = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

  let historyEntries: any[] = []
  try {
    const rows = await db
      .select({
        id: auditHistory.id,
        itemId: auditHistory.itemId,
        previousStatus: auditHistory.previousStatus,
        newStatus: auditHistory.newStatus,
        note: auditHistory.note,
        createdAt: auditHistory.createdAt,
      })
      .from(auditHistory)
      .orderBy(desc(auditHistory.createdAt))
      .limit(200)
    historyEntries = rows.map(r => ({
      ...r,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    }))
  } catch {}

  return NextResponse.json({
    score,
    previousScore: STATIC_DATA.previousScore,
    lastUpdated: new Date().toISOString().split('T')[0],
    summary: { total, completed: totalCompleted, inProgress: totalInProgress, pending: totalPending },
    categories: categoriesWithStats,
    changelog,
    history: historyEntries,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
  if ('error' in auth) return auth.error

  let body: { item_id?: string; status?: string; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }

  const { item_id, status, note } = body
  if (!item_id || !status) {
    return NextResponse.json({ detail: 'item_id and status are required' }, { status: 400 })
  }
  if (!['completed', 'in_progress', 'pending'].includes(status)) {
    return NextResponse.json({ detail: 'Invalid status' }, { status: 400 })
  }

  const staticMap = buildCategoryMap()
  const staticItem = staticMap.get(item_id)
  if (!staticItem) {
    return NextResponse.json({ detail: `Unknown item_id: ${item_id}` }, { status: 400 })
  }

  try {
    const db = getDb()

    const lastOverride = await db
      .select({ newStatus: auditHistory.newStatus })
      .from(auditHistory)
      .where(eq(auditHistory.itemId, item_id))
      .orderBy(desc(auditHistory.createdAt))
      .limit(1)

    const currentStatus = lastOverride.length > 0 ? lastOverride[0].newStatus : staticItem.status

    await db.insert(auditHistory).values({
      itemId: item_id,
      previousStatus: currentStatus,
      newStatus: status,
      note: note || null,
      changedBy: auth.user.sub,
    })
  } catch (err) {
    console.error('audit-fonc PUT error:', err)
    return NextResponse.json({ detail: 'Database error' }, { status: 500 })
  }

  const response = await GET()
  const data = await response.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
  if ('error' in auth) return auth.error

  let body: { note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }

  const { note } = body
  if (!note || !note.trim()) {
    return NextResponse.json({ detail: 'note is required' }, { status: 400 })
  }

  try {
    const db = getDb()
    await db.insert(auditHistory).values({
      itemId: 'JOURNAL',
      previousStatus: null,
      newStatus: 'note',
      note: note.trim(),
      changedBy: auth.user.sub,
    })
  } catch (err) {
    console.error('audit-fonc POST error:', err)
    return NextResponse.json({ detail: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ detail: 'Journal entry added' })
}
