'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

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

interface HistoryEntry {
  id: string
  itemId: string
  previousStatus: string | null
  newStatus: string
  note: string | null
  createdAt: string
}

interface AuditData {
  score: number
  previousScore: number
  lastUpdated: string
  summary: { total: number; completed: number; inProgress: number; pending: number }
  categories: AuditCategory[]
  changelog: ChangelogEntry[]
  history: HistoryEntry[]
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  completed: { label: 'Résolu', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  in_progress: { label: 'En cours', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: 'En attente', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Résolu' },
]

function decodeToken(token: string): { role?: string; sub?: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch { return null }
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
        <span className={`text-xs mt-1 ${score - previousScore >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {score - previousScore >= 0 ? '+' : ''}{score - previousScore} pts
        </span>
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

function statusClass(color: string): string {
  switch (color) {
    case 'destructive': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
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

  const [editMode, setEditMode] = useState(false)
  const [changingItem, setChangingItem] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>('pending')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [journalNote, setJournalNote] = useState('')
  const [savingJournal, setSavingJournal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('dhayaro_token')
    if (token) {
      const decoded = decodeToken(token)
      if (decoded && (decoded.role === 'SUPER_ADMIN' || decoded.role === 'ADMIN')) {
        setIsAdmin(true)
      }
    }
  }, [])

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

  const fetchData = () => {
    fetch('/api/v1/audit-fonc')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Erreur de chargement'); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const handleStatusChange = async (itemId: string) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('dhayaro_token')
      const res = await fetch('/api/v1/audit-fonc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ item_id: itemId, status: newStatus, note: note || undefined }),
      })
      if (!res.ok) throw new Error('Erreur')
      const updated = await res.json()
      setData(updated)
      setChangingItem(null)
      setNote('')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour cet élément. Veuillez réessayer.', variant: 'destructive' })
    }
    setSaving(false)
  }

  const handleJournalSubmit = async () => {
    if (!journalNote.trim()) return
    setSavingJournal(true)
    try {
      const token = localStorage.getItem('dhayaro_token')
      const res = await fetch('/api/v1/audit-fonc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ note: journalNote.trim() }),
      })
      if (!res.ok) throw new Error('Erreur')
      setJournalNote('')
      fetchData()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter cette note. Veuillez réessayer.', variant: 'destructive' })
    }
    setSavingJournal(false)
  }

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
            {isAdmin && (
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  editMode
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {editMode ? 'Mode édition actif' : 'Mode édition'}
              </button>
            )}
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
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${statusClass(cat.color)}`}>{cat.id}</span>
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
                    {cat.items.map((item) => {
                      const isChanging = changingItem === item.id
                      return (
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
                            {editMode && isAdmin ? (
                              isChanging ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="text-[11px] px-1 py-0.5 rounded border border-border bg-background text-foreground"
                                  >
                                    {STATUS_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleStatusChange(item.id)}
                                    disabled={saving}
                                    className="text-[11px] px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => { setChangingItem(null); setNote('') }}
                                    className="text-[11px] px-2 py-0.5 rounded text-muted-foreground hover:text-foreground"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => { setChangingItem(item.id); setNewStatus(item.status); setNote('') }}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-400 ${STATUS_CONFIG[item.status].class}`}
                                  >
                                    {STATUS_CONFIG[item.status].label}
                                    <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status].class}`}>
                                {STATUS_CONFIG[item.status].label}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {editMode && isAdmin && changingItem && (
                      <div className="border-t border-border pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Note (optionnelle) — expliquer ce qui a été fait..."
                          className="w-full text-xs p-2 rounded border border-border bg-background text-foreground resize-none"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isAdmin && editMode && (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-2">Ajouter une entrée au journal de travail</h3>
            <p className="text-xs text-muted-foreground mb-3">Note libre pour documenter votre travail (non liée à un item spécifique)</p>
            <div className="flex gap-2">
              <textarea
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                placeholder="Décrivez ce que vous avez fait..."
                className="flex-1 text-xs p-2 rounded border border-border bg-background text-foreground resize-none"
                rows={2}
              />
              <button
                onClick={handleJournalSubmit}
                disabled={savingJournal || !journalNote.trim()}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shrink-0 self-end"
              >
                {savingJournal ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Journal des modifications</h2>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            {historyOpen ? 'Masquer historique' : `Voir historique (${data.history?.length || 0})`}
          </button>
        </div>

        <div className="space-y-3 mb-8">
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

        {historyOpen && data.history && data.history.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-4">Journal de travail (historique en direct)</h2>
            <div className="space-y-2 mb-10">
              {data.history.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{entry.itemId}</span>
                      {entry.previousStatus && (
                        <>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[entry.previousStatus]?.class || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_CONFIG[entry.previousStatus]?.label || entry.previousStatus}
                          </span>
                          <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </>
                      )}
                      {entry.itemId !== 'JOURNAL' && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[entry.newStatus]?.class || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_CONFIG[entry.newStatus]?.label || entry.newStatus}
                        </span>
                      )}
                      {entry.itemId === 'JOURNAL' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Note</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {historyOpen && (!data.history || data.history.length === 0) && (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 mb-10 text-center">
            <p className="text-sm text-muted-foreground">Aucune entrée dans le journal de travail. Activez le mode édition pour commencer à suivre vos modifications.</p>
          </div>
        )}

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
