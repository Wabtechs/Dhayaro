'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { HELP_GUIDES, type HelpGuide } from '@/data/help-guides'
import { ROLE_LABELS } from '@/lib/permissions'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  ListOrdered,
  UserRound,
  Stethoscope,
  FileText,
  ClipboardList,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import type { UserRole } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ListOrdered,
  UserRound,
  Stethoscope,
  FileText,
  ClipboardList,
  Bell,
  BookOpen,
}

function StepCard({ step, index }: { step: { title: string; description: string }; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: { title: string; icon: string; steps: { title: string; description: string }[] } }) {
  const [expanded, setExpanded] = useState(true)
  const Icon = ICON_MAP[section.icon] || BookOpen

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="flex-1 text-base font-semibold text-foreground">{section.title}</h3>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="space-y-3 px-5 pb-5">
          {section.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function RoleGuide({ guide }: { guide: HelpGuide }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-6">
        <h2 className="text-xl font-bold text-foreground">{guide.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
      </div>
      <div className="space-y-4">
        {guide.sections.map((section, i) => (
          <SectionCard key={i} section={section} />
        ))}
      </div>
    </div>
  )
}

export default function HelpPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  const userRole = user?.role as UserRole | undefined

  const availableGuides = userRole
    ? HELP_GUIDES.filter((g) => {
        if (userRole === 'super_admin') return true
        return g.role === userRole
      })
    : []

  const filteredGuides = availableGuides.map((guide) => ({
    ...guide,
    sections: guide.sections
      .map((section) => ({
        ...section,
        steps: section.steps.filter(
          (step) =>
            !searchQuery ||
            step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            step.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((section) => section.steps.length > 0),
  })).filter((guide) => guide.sections.length > 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Aide</h1>
          <p className="text-sm text-muted-foreground">
            Guide d'utilisation pour{' '}
            <Badge variant="secondary" className="font-medium">
              {userRole ? ROLE_LABELS[userRole] ?? userRole : '...'}
            </Badge>
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher dans le guide..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        {filteredGuides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {searchQuery ? 'Aucun résultat trouvé' : 'Guide non disponible'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? 'Essayez de modifier votre recherche.'
                : 'Aucun guide n\'est encore disponible pour votre rôle.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGuides.map((guide, i) => (
              <RoleGuide key={i} guide={guide} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
