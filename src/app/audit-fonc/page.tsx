'use client'

import { useEffect, useState } from 'react'

interface AuditItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'pending'
  module?: string
  prompt?: string | null
  detail?: string | null
  files?: string[] | null
}

interface AuditCategory {
  id: string
  name: string
  color: string
  icon: string
  items: AuditItem[]
  completedCount: number
  inProgressCount: number
  totalCount: number
}

interface ChangelogEntry {
  date: string
  version: string
  items: string[]
}

interface AuditData {
  score: number
  previousScore: number
  lastUpdated: string
  summary: { total: number; completed: number; inProgress: number; pending: number }
  categories: AuditCategory[]
  changelog: ChangelogEntry[]
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  completed: { label: 'Résolu', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  in_progress: { label: 'En cours', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: 'En attente', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
}

function ScoreRing({ score, previousScore }: { score: number; previousScore: number }) {
  const r = 90
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="220" height="220" className="-rotate-90">
        <circle cx="110" cy="110" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-700" />
        <circle cx="110" cy="110" r={r} fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
        <span className="text-xs text-green-600 dark:text-green-400 mt-1">+{score - previousScore} pts</span>
      </div>
    </div>
  )
}

function getCategoryColor(color: string): string {
  switch (color) {
    case 'destructive': return 'border-red-400 dark:border-red-600'
    case 'warning': return 'border-amber-400 dark:border-amber-600'
    case 'info': return 'border-blue-400 dark:border-blue-600'
    default: return 'border-gray-300 dark:border-gray-600'
  }
}

function getProgressColor(color: string): string {
  switch (color) {
    case 'destructive': return 'bg-red-500'
    case 'warning': return 'bg-amber-500'
    case 'info': return 'bg-blue-500'
    default: return 'bg-blue-500'
  }
}

export default function AuditFoncPage() {
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [promptItem, setPromptItem] = useState<AuditItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dhayaro-dark-mode')
    const isDark = stored === 'true'
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('dhayaro-dark-mode', String(next))
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  useEffect(() => {
    fetch('/api/v1/audit-fonc')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Erreur de chargement'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error || 'Erreur inconnue'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Audit Fonctionnel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivi de l&apos;évolution de l&apos;application Dhayaro
          </p>
          <p className="text-xs text-muted-foreground">Dernière mise à jour : {data.lastUpdated}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          <ScoreRing score={data.score} previousScore={data.previousScore} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total" value={data.summary.total} color="text-foreground" />
            <SummaryCard label="Résolus" value={data.summary.completed} color="text-green-600 dark:text-green-400" />
            <SummaryCard label="En cours" value={data.summary.inProgress} color="text-blue-600 dark:text-blue-400" />
            <SummaryCard label="En attente" value={data.summary.pending} color="text-gray-500" />
          </div>
        </div>

        <div className="space-y-3 mb-10">
          {data.categories.map((cat) => {
            const isExpanded = expanded === cat.id
            const pct = cat.totalCount > 0 ? Math.round((cat.completedCount / cat.totalCount) * 100) : 0
            return (
              <div key={cat.id} className={`rounded-xl border bg-card text-card-foreground shadow-sm ${getCategoryColor(cat.color)}`}>
                <button onClick={() => setExpanded(isExpanded ? null : cat.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                      cat.color === 'destructive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      cat.color === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      cat.color === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>{cat.id}</span>
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({cat.completedCount}/{cat.totalCount})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden hidden sm:block">
                      <div className={`h-full rounded-full transition-all ${getProgressColor(cat.color)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-3 space-y-2">
                    {cat.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                            {item.module && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{item.module}</span>
                            )}
                            {item.files && item.files.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">({item.files.length} fichier{item.files.length > 1 ? 's' : ''})</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          {item.detail && item.status !== 'completed' && (
                            <details className="mt-1">
                              <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Détails</summary>
                              <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap font-mono">{item.detail}</pre>
                            </details>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {item.prompt && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPromptItem(item); setCopied(false) }}
                              className="text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              Prompt
                            </button>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status].class}`}>
                            {STATUS_CONFIG[item.status].label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-4">Journal des modifications</h2>
        <div className="space-y-3">
          {data.changelog.map((entry) => (
            <div key={entry.date} className="rounded-xl border bg-card text-card-foreground shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{entry.version}</span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.items.map((itemId) => (
                  <span key={itemId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{itemId}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 mb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Application développée avec Next.js 15 • React 19 • TypeScript • Tailwind CSS • Drizzle ORM • PostgreSQL
          </p>
        </div>
      </div>

      {promptItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPromptItem(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{promptItem.id}</span>
                <h3 className="text-lg font-semibold text-foreground">{promptItem.title}</h3>
              </div>
              <button onClick={() => setPromptItem(null)} className="text-muted-foreground hover:text-foreground p-1">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-border">
                {promptItem.prompt}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              {copied && <span className="text-xs text-green-600 dark:text-green-400">Copié !</span>}
              <button
                onClick={() => { navigator.clipboard.writeText(promptItem.prompt || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Copier le prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm px-4 py-3 text-center min-w-[100px]">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
