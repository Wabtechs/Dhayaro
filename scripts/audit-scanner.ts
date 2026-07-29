import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const VIEWS_DIR = join(ROOT, 'src', 'views')
const API_DIR = join(ROOT, 'src', 'app', 'api', 'v1')
const OUTPUT = join(ROOT, 'src', 'lib', 'audit-data.generated.json')

interface ScanFinding {
  id: string
  title: string
  description: string
  module: string
  status: 'completed' | 'in_progress' | 'pending'
  files?: string[]
  detail?: string
}

function readFile(path: string): string {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function listFiles(dir: string, ext: string): string[] {
  const result: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) result.push(...listFiles(full, ext))
      else if (e.name.endsWith(ext)) result.push(full)
    }
  } catch {}
  return result
}

function relativePath(abs: string): string {
  return abs.replace(ROOT + '\\', '').replace(ROOT + '/', '').replace(/\\/g, '/')
}

// ── View analysis ──
function analyzeViews(): ScanFinding[] {
  const findings: ScanFinding[] = []
  const viewFiles = listFiles(VIEWS_DIR, '.tsx').filter(f => f.endsWith('index.tsx'))

  // Check pagination
  const noPagination: string[] = []
  const clientPagination: string[] = []
  const serverPagination: string[] = []
  const noSearch: string[] = []
  const noDarkMode: string[] = []
  const noSkeleton: string[] = []
  const noLoading: string[] = []
  const clientSearch: string[] = []

  for (const file of viewFiles) {
    const content = readFile(file)
    const rel = relativePath(file)

    const hasServerPage = /page=\$\{?currentPage\}?/.test(content)
    const hasSize = /size=\d+/.test(content)
    const hasClientPage = /ITEMS_PER_PAGE/.test(content) && /\.slice\(/.test(content)
    const hasUseMemoFilter = /useMemo/.test(content) && /\.filter\(/.test(content)
    const hasSearchParam = /search=\$\{?search\}?/.test(content)
    const hasClientSideSearch = /\.toLowerCase\(\)/.test(content) && /\.includes\(/.test(content)
    const hasDark = /dark:/.test(content)
    const hasSkeleton = /Skeleton|skeleton/.test(content)
    const hasLoading = /isLoading/.test(content)
    const hasTotal = /totalCount/.test(content) || /totalElements/.test(content)

    if (hasServerPage && hasSize) serverPagination.push(rel)
    else if (hasClientPage || hasUseMemoFilter) clientPagination.push(rel)
    else noPagination.push(rel)

    if (!hasSearchParam && hasClientSideSearch) clientSearch.push(rel)
    if (!hasSearchParam) noSearch.push(rel)

    if (!hasDark) noDarkMode.push(rel)
    if (!hasSkeleton) noSkeleton.push(rel)
    if (!hasLoading) noLoading.push(rel)
  }

  const paginatedCount = serverPagination.length
  const viewCount = viewFiles.length

  findings.push({
    id: 'C-01',
    title: 'Pagination serveur',
    description: `${paginatedCount}/${viewCount} vues utilisent la pagination serveur`,
    module: 'Global',
    status: paginatedCount === viewCount ? 'completed' : paginatedCount > 0 ? 'in_progress' : 'pending',
    files: [...serverPagination],
    detail: `Avec pagination serveur : ${serverPagination.join(', ') || 'aucune'}\nEncore en client-side : ${clientPagination.join(', ') || 'aucune'}`,
  })

  if (noSearch.length > 0) {
    findings.push({
      id: 'M-03',
      title: 'Recherche API patients',
      description: `${viewCount - noSearch.length}/${viewCount} vues transmettent la recherche à l'API`,
      module: 'Patients',
      status: noSearch.length < viewCount ? 'in_progress' : 'pending',
      files: noSearch.length < viewCount ? [] : noSearch,
    })
  }

  if (noDarkMode.length > 0) {
    findings.push({
      id: 'UX-01b',
      title: 'Mode sombre',
      description: `${viewCount - noDarkMode.length}/${viewCount} vues supportent le mode sombre`,
      module: 'Global',
      status: noDarkMode.length === 0 ? 'completed' : 'in_progress',
      detail: noDarkMode.length === 0 ? undefined : `Sans dark mode : ${noDarkMode.slice(0, 5).join(', ')}`,
    })
  }

  if (noSkeleton.length > 0) {
    findings.push({
      id: 'UX-01',
      title: 'Skeletons de chargement',
      description: `${viewCount - noSkeleton.length}/${viewCount} vues ont des skeletons`,
      module: 'Global',
      status: 'pending',
      detail: noSkeleton.length === viewCount ? 'Aucune vue n\'a de skeleton' : undefined,
    })
  }

  return findings
}

// ── API route analysis ──
function analyzeAPIRoutes(): ScanFinding[] {
  const findings: ScanFinding[] = []
  const apiFiles = listFiles(API_DIR, '.ts').filter(f => f.endsWith('route.ts'))
  const apiDirs = new Set(apiFiles.map(f => dirname(f)))

  // Track route coverage
  const allRoutes = [...apiDirs].map(d => relativePath(d).replace('src/app/api/v1/', '/api/v1/'))
  const middleware = readFile(join(ROOT, 'src', 'middleware.ts'))
  const coveredRoutes: string[] = []
  const uncoveredRoutes: string[] = []

  for (const route of allRoutes) {
    if (middleware.includes(`'${route}'`)) coveredRoutes.push(route)
    else uncoveredRoutes.push(route)
  }

  findings.push({
    id: 'M-02',
    title: 'Middleware API routes',
    description: `${coveredRoutes.length}/${allRoutes.length} routes couvertes par le middleware`,
    module: 'Sécurité',
    status: uncoveredRoutes.length === 0 ? 'completed' : 'in_progress',
    files: uncoveredRoutes.length > 0 ? uncoveredRoutes : undefined,
    detail: uncoveredRoutes.length === 0 ? undefined : `Non couvertes : ${uncoveredRoutes.join(', ')}`,
  })

  // Check DELETE patterns
  const physicalDeletes: string[] = []
  const softDeletes: string[] = []
  const cancelledStatus: string[] = []

  for (const file of apiFiles) {
    const content = readFile(file)
    const rel = relativePath(file)

    const hasDelete = /\.delete\(/.test(content) && content.includes('DELETE')
    const hasSoftDelete = /\.update\(.*\)\.set\(\{.*is_active.*false/.test(content) || /\.update\(.*\)\.set\(\{.*isActive.*false/.test(content)
    const hasCancelled = /CANCELLED/.test(content)

    if (hasDelete && !hasSoftDelete) {
      const entity = rel.match(/api\/v1\/([^/]+)/)?.[1] || rel
      if (entity !== 'patients' || content.includes('requireRole') || content.includes('ADMIN'))
        physicalDeletes.push(rel)
    }
    if (hasSoftDelete) softDeletes.push(rel)
    if (hasCancelled) cancelledStatus.push(rel)
  }

  findings.push({
    id: 'C-05',
    title: 'Suppressions physiques',
    description: `Soft-delete : ${softDeletes.length}, physique : ${physicalDeletes.length}`,
    module: 'Global',
    status: physicalDeletes.length === 0 ? 'completed' : 'in_progress',
    files: physicalDeletes.length > 0 ? physicalDeletes : undefined,
    detail: physicalDeletes.length === 0 ? undefined : `Encore DELETE physique : ${physicalDeletes.join(', ')}`,
  })

  // Check pagination support in GET handlers
  const withPagination: string[] = []
  const withoutPagination: string[] = []

  for (const file of apiFiles) {
    const content = readFile(file)
    if (!content.includes('export async function GET')) continue
    const rel = relativePath(file)
    if (content.includes('parsePagination')) withPagination.push(rel)
    else withoutPagination.push(rel)
  }

  findings.push({
    id: 'P-01',
    title: 'Pagination API serveur',
    description: `${withPagination.length}/${withPagination.length + withoutPagination.length} routes GET utilisent parsePagination`,
    module: 'Global',
    status: withoutPagination.length === 0 ? 'completed' : 'in_progress',
    detail: withoutPagination.length === 0 ? undefined : `Sans pagination : ${withoutPagination.join(', ')}`,
  })

  // Check audit trail
  const withAudit: string[] = []
  for (const file of apiFiles) {
    const content = readFile(file)
    if (content.includes('createAuditEntry') || content.includes('audit')) withAudit.push(relativePath(file))
  }

  findings.push({
    id: 'C-08',
    title: 'Audit trail',
    description: `${withAudit.length} fichiers API avec audit`,
    module: 'Global',
    status: withAudit.length >= 10 ? 'completed' : withAudit.length > 0 ? 'in_progress' : 'pending',
    files: withAudit,
  })

  // Check duplicate validation on patients POST
  const patientsRoute = apiFiles.find(f => f.includes('patients') && f.endsWith('route.ts') && !f.includes('[id]'))
  if (patientsRoute) {
    const content = readFile(patientsRoute)
    const hasDupCheck = /existing/.test(content) && /409/.test(content)
    findings.push({
      id: 'C-02',
      title: 'Doublons patients',
      description: 'Validation nom+téléphone à la création',
      module: 'Patients',
      status: hasDupCheck ? 'completed' : 'pending',
    })
  }

  // Check refresh token security
  const loginRoute = apiFiles.find(f => f.includes('login') && f.endsWith('route.ts'))
  const refreshRoute = apiFiles.find(f => f.includes('refresh') && f.endsWith('route.ts'))
  if (loginRoute && refreshRoute) {
    const loginContent = readFile(loginRoute)
    const refreshContent = readFile(refreshRoute)
    const hasHttpOnly = /httpOnly/.test(loginContent) || /httpOnly/.test(refreshContent)
    const readsFromCookie = /cookies\.get\(/.test(refreshContent)
    findings.push({
      id: 'C-03',
      title: 'Refresh token sécurisé',
      description: 'Cookie httpOnly au lieu de localStorage',
      module: 'Auth',
      status: hasHttpOnly && readsFromCookie ? 'completed' : 'pending',
      files: [relativePath(loginRoute), relativePath(refreshRoute)],
    })
  }

  // Check DELETE restriction on patients
  const patientsIdRoute = apiFiles.find(f => f.includes('patients') && f.includes('[id]'))
  if (patientsIdRoute) {
    const content = readFile(patientsIdRoute)
    const roleCheck = content.includes('SUPER_ADMIN') && content.includes('ADMIN')
    findings.push({
      id: 'C-04',
      title: 'DELETE patients restreint',
      description: 'Seul ADMIN/SUPER_ADMIN peut supprimer',
      module: 'Patients',
      status: roleCheck ? 'completed' : 'pending',
    })
  }

  // Check UUID validation
  const withUuidCheck: string[] = []
  for (const file of apiFiles) {
    const content = readFile(file)
    if (content.includes('sanitizeUuid')) withUuidCheck.push(relativePath(file))
  }
  findings.push({
    id: 'S-03',
    title: 'Validation UUID API',
    description: `${withUuidCheck.length} routes valident les UUIDs`,
    module: 'Sécurité',
    status: withUuidCheck.length > 10 ? 'completed' : 'in_progress',
    files: withUuidCheck,
  })

  // Phone validation
  if (patientsRoute) {
    const content = readFile(patientsRoute)
    const hasPhoneValidation = /\\+243/.test(content) || /phone.*regex/.test(content)
    findings.push({
      id: 'A-01',
      title: 'Format téléphone +243',
      description: 'Validation format RDC',
      module: 'Patients',
      status: hasPhoneValidation ? 'completed' : 'pending',
    })
  }

  return findings
}

// ── Sidebar analysis ──
function analyzeSidebar(): ScanFinding[] {
  const sidebarFile = join(ROOT, 'src', 'components', 'layout', 'sidebar.tsx')
  const content = readFile(sidebarFile)

  const noPermission: string[] = []
  const permissionRegex = /label:\s*'([^']+)'[^}]*?\}/gs
  let match
  while ((match = permissionRegex.exec(content)) !== null) {
    const block = match[0]
    const label = match[1]
    if (!block.includes('permission:') && !block.includes('permissions:')) {
      noPermission.push(label)
    }
  }

  return [{
    id: 'M-01',
    title: 'Permissions sidebar',
    description: `${noPermission.length} entrées sans permission`,
    module: 'Layout',
    status: noPermission.length === 0 ? 'completed' : 'in_progress',
    detail: noPermission.length === 0 ? undefined : `Sans permission : ${noPermission.join(', ')}`,
  }]
}

// ── Utils analysis ──
function analyzeUtils(): ScanFinding[] {
  const utilsFile = join(ROOT, 'src', 'lib', 'utils.ts')
  const content = readFile(utilsFile)

  const hasTimezone = /timeZone.*Africa/.test(content)
  return [{
    id: 'A-10',
    title: 'Fuseau horaire',
    description: 'Africa/Lubumbashi dans formatDate et formatDateTime',
    module: 'Global',
    status: hasTimezone ? 'completed' : 'pending',
  }]
}

// ── Main ──
function scan(): void {
  const viewsFindings = analyzeViews()
  const apiFindings = analyzeAPIRoutes()
  const sidebarFindings = analyzeSidebar()
  const utilsFindings = analyzeUtils()

  const allFindings = [...viewsFindings, ...apiFindings, ...sidebarFindings, ...utilsFindings]

  const completed = allFindings.filter(f => f.status === 'completed').length
  const inProgress = allFindings.filter(f => f.status === 'in_progress').length
  const pending = allFindings.filter(f => f.status === 'pending').length

  const today = new Date().toISOString().split('T')[0]

  const output = {
    score: Math.round((completed / allFindings.length) * 100),
    previousScore: 62,
    lastUpdated: today,
    dynamic: true,
    summary: { total: allFindings.length, completed, inProgress, pending },
    categories: [
      {
        id: 'SCAN',
        name: 'Analyse dynamique',
        color: 'info',
        icon: 'scan',
        items: allFindings.map(f => ({
          id: f.id,
          title: f.title,
          description: f.description,
          module: f.module,
          status: f.status,
          detail: f.detail,
          files: f.files,
        })),
      },
    ],
    changelog: [{ date: today, version: 'Scan auto', items: allFindings.filter(f => f.status === 'completed').map(f => f.id) }],
  }

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`[audit-scanner] ✅ ${allFindings.length} findings (${completed} done, ${inProgress} in-progress, ${pending} pending)`)
  console.log(`[audit-scanner] 📁 ${OUTPUT}`)
}

scan()
