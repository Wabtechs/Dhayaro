import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const VIEWS_DIR = join(ROOT, 'src', 'views')
const API_DIR = join(ROOT, 'src', 'app', 'api', 'v1')
const OUTPUT = join(ROOT, 'src', 'lib', 'audit-data.generated.json')

function readFile(path) {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function listFiles(dir, ext) {
  const result = []
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

function relPath(abs) {
  return abs.replace(ROOT + '\\', '/').replace(ROOT + '/', '').replace(/\\/g, '/')
}

function analyzeViews() {
  const findings = []
  const viewFiles = listFiles(VIEWS_DIR, '.tsx').filter(f => f.endsWith('index.tsx'))
  const viewCount = viewFiles.length

  let serverPag = 0, clientPag = 0, noPag = 0
  const serverList = [], clientList = [], noPagList = []

  for (const file of viewFiles) {
    const content = readFile(file)
    const rel = relPath(file)
    const hasServer = (/\bpage=\$\{/.test(content) || /URLSearchParams.*page/.test(content)) && /\bsize=\d+/.test(content)
    const hasClient = /ITEMS_PER_PAGE/.test(content) && (/\.slice\(/.test(content) || /useMemo/.test(content))

    if (hasServer) { serverPag++; serverList.push(rel) }
    else if (hasClient) { clientPag++; clientList.push(rel) }
    else { noPag++; noPagList.push(rel) }
  }

  findings.push({
    id: 'C-01', title: 'Pagination serveur',
    description: `${serverPag}/${viewCount} vues utilisent la pagination serveur`,
    module: 'Global',
    status: serverPag > 0 ? (serverPag === viewCount ? 'completed' : 'in_progress') : 'pending',
    files: serverList,
    detail: `Avec pagination serveur : ${serverList.join(', ') || 'aucune'}\nEncore en client-side : ${clientList.join(', ') || 'aucune'}`,
  })

  const noSearch = viewFiles.filter(f => !(/\bsearch=\$\{/.test(readFile(f)) || /URLSearchParams.*search/.test(readFile(f))))
  findings.push({
    id: 'M-03', title: 'Recherche API',
    description: `${viewCount - noSearch.length}/${viewCount} vues transmettent la recherche à l'API`,
    module: 'Global',
    status: noSearch.length === 0 ? 'completed' : 'in_progress',
  })

  const noDark = viewFiles.filter(f => !readFile(f).includes('dark:'))
  findings.push({
    id: 'UX-01b', title: 'Mode sombre',
    description: `${viewCount - noDark.length}/${viewCount} vues supportent le mode sombre`,
    module: 'Global',
    status: noDark.length === 0 ? 'completed' : 'in_progress',
    detail: `Sans dark mode : ${noDark.slice(0, 5).map(f => relPath(f)).join(', ')}`,
  })

  const noSkeleton = viewFiles.filter(f => !/Skeleton|skeleton/.test(readFile(f)))
  findings.push({
    id: 'UX-01', title: 'Skeletons de chargement',
    description: `${viewCount - noSkeleton.length}/${viewCount} vues ont des skeletons`,
    module: 'Global',
    status: 'pending',
    detail: `${noSkeleton.length}/${viewCount} vues sans skeleton`,
  })

  return findings
}

function analyzeAPIRoutes() {
  const findings = []
  const apiFiles = listFiles(API_DIR, '.ts').filter(f => f.endsWith('route.ts'))

  const middleware = readFile(join(ROOT, 'src', 'middleware.ts'))
  const allRoutes = [...new Set(apiFiles.map(f => {
    const r = relPath(dirname(f)).replace('src/app/api/v1', '/api/v1')
    return r.includes('[id]') ? r.replace(/\/\[id\].*/, '/[id]') : r
  }))]
  const covered = allRoutes.filter(r => middleware.includes(`'${r}'`))
  const uncovered = allRoutes.filter(r => !middleware.includes(`'${r}'`))

  findings.push({
    id: 'M-02', title: 'Routes API dans middleware',
    description: `${covered.length}/${allRoutes.length} routes couvertes`,
    module: 'Sécurité',
    status: uncovered.length === 0 ? 'completed' : 'in_progress',
    files: uncovered,
    detail: uncovered.length === 0 ? undefined : `Non couvertes : ${uncovered.join(', ')}`,
  })

  const withPagination = apiFiles.filter(f => /parsePagination/.test(readFile(f)) && /export async function GET/.test(readFile(f)))
  const withoutPagination = apiFiles.filter(f => !/parsePagination/.test(readFile(f)) && /export async function GET/.test(readFile(f)))
  findings.push({
    id: 'P-01', title: 'Pagination API',
    description: `${withPagination.length}/${withPagination.length + withoutPagination.length} routes GET paginées`,
    module: 'Global',
    status: withoutPagination.length === 0 ? 'completed' : 'in_progress',
    detail: withoutPagination.length === 0 ? undefined : `Sans pagination : ${withoutPagination.map(f => relPath(f)).join(', ')}`,
  })

  const soft = apiFiles.filter(f => /\.update\(.*\)\.set\(\{.*is_active.*false/.test(readFile(f)))
  const cancelled = apiFiles.filter(f => /CANCELLED/.test(readFile(f)))
  findings.push({
    id: 'C-05/C-06', title: 'Soft-delete',
    description: `${soft.length} soft-delete, ${cancelled.length} statut CANCELLED`,
    module: 'Global',
    status: soft.length + cancelled.length > 0 ? 'completed' : 'pending',
  })

  const withAudit = apiFiles.filter(f => /logAudit/.test(readFile(f)))
  findings.push({
    id: 'C-08', title: 'Audit trail',
    description: `${withAudit.length} fichiers API avec audit`,
    module: 'Global',
    status: withAudit.length >= 6 ? 'completed' : withAudit.length > 0 ? 'in_progress' : 'pending',
  })

  const withUuid = apiFiles.filter(f => /sanitizeUuid/.test(readFile(f)))
  findings.push({
    id: 'S-03', title: 'Validation UUID',
    description: `${withUuid.length} routes valident les UUIDs`,
    module: 'Sécurité',
    status: withUuid.length > 5 ? 'completed' : 'in_progress',
  })

  return findings
}

function analyzeSidebar() {
  const content = readFile(join(ROOT, 'src', 'components', 'layout', 'sidebar.tsx'))
  const noPermission = []
  const regex = /label:\s*'([^']+)'[^}]*?\}/gs
  let match
  while ((match = regex.exec(content)) !== null) {
    if (!match[0].includes('permission')) noPermission.push(match[1])
  }
  return [{
    id: 'M-01', title: 'Permissions sidebar',
    description: `${noPermission.length} entrées sans permission`,
    module: 'Layout',
    status: noPermission.length === 0 ? 'completed' : 'in_progress',
    detail: noPermission.length === 0 ? undefined : `Sans permission : ${noPermission.join(', ')}`,
  }]
}

// Main
const findings = [...analyzeViews(), ...analyzeAPIRoutes(), ...analyzeSidebar()]
const completed = findings.filter(f => f.status === 'completed').length
const inProgress = findings.filter(f => f.status === 'in_progress').length
const pending = findings.filter(f => f.status === 'pending').length
const today = new Date().toISOString().split('T')[0]

const output = {
  score: findings.length > 0 ? Math.round((completed / findings.length) * 100) : 0,
  previousScore: 62,
  lastUpdated: today,
  dynamic: true,
  summary: { total: findings.length, completed, inProgress, pending },
  categories: [{
    id: 'SCAN',
    name: 'Analyse dynamique',
    color: 'info',
    icon: 'scan',
    items: findings.map(f => ({
      id: f.id, title: f.title, description: f.description,
      module: f.module, status: f.status,
      detail: f.detail || null, files: f.files || null,
    })),
  }],
  changelog: [{ date: today, version: 'Scan auto', items: findings.filter(f => f.status === 'completed').map(f => f.id) }],
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8')
console.log(`[audit-scanner] ${findings.length} findings (${completed} done, ${inProgress} in-progress, ${pending} pending)`)
