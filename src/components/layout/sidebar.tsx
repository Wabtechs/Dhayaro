'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/ui/logo'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/lib/permissions'
import { ROLE_LABELS } from '@/lib/permissions'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  UserCog,
  Stethoscope,
  Brain,
  Bug,
  Pill,
  TestTube,
  ListOrdered,
  FileText,
  Archive,
  Bell,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  permission?: Permission
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'File d\'attente', icon: ListOrdered, href: '/queue', permission: 'queue:list' },
      { label: 'Patients', icon: UserRound, href: '/patients', permission: 'patients:list' },
    ],
  },
  {
    label: 'CONSULTATION',
    items: [
      { label: 'Consultations', icon: Stethoscope, href: '/consultations', permission: 'consultations:list' },
      { label: 'Diagnostics', icon: Brain, href: '/diagnostics', permission: 'diagnostics:list' },
      { label: 'Maladies', icon: Bug, href: '/diseases', permission: 'diseases:list' },
      { label: 'Médecins', icon: UserCog, href: '/doctors', permission: 'users:list' },
    ],
  },
  {
    label: 'TRAITEMENT',
    items: [
      { label: 'Traitements', icon: Pill, href: '/treatments', permission: 'treatments:list' },
      { label: 'Laboratoire', icon: TestTube, href: '/laboratory', permission: 'lab:list' },
    ],
  },
  {
    label: 'DOCUMENTS',
    items: [
      { label: 'Documents', icon: FileText, href: '/documents', permission: 'documents:list' },
      { label: 'Archives', icon: Archive, href: '/archives', permission: 'archives:list' },
    ],
  },
  {
    label: 'ANALYTIQUE',
    items: [
      { label: 'Rapports', icon: FileBarChart, href: '/reports', permission: 'reports:read' },
      { label: 'Notifications', icon: Bell, href: '/notifications', permission: 'notifications:list' },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { label: 'Utilisateurs', icon: Users, href: '/users', permission: 'users:list' },
      { label: 'Établissements', icon: Building2, href: '/facilities', permission: 'facilities:list' },
      { label: 'Paramètres', icon: Settings, href: '/settings', permission: 'settings:read' },
      { label: 'Journal d\'audit', icon: Shield, href: '/audit', permission: 'audit:read' },
    ],
  },
]

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = item.href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(item.href)

  const linkContent = (
    <>
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-primary hover:bg-accent'
      )}
    >
      {linkContent}
    </Link>
  )
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const collapsed = !sidebarOpen

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.permission || can(item.permission)),
    }))
    .filter(section => section.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Logo className="h-7 w-7 shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground">
            Dhayaro
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-6 px-3">
            {filteredSections.map((section) => (
              <div key={section.label}>
                {!collapsed && (
                  <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}
                  </span>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <NavItemLink item={item} collapsed={collapsed} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-full justify-center rounded-lg"
                onClick={logout}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium">{user?.name ?? 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : 'Rôle'}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{user?.name ?? 'Utilisateur'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
