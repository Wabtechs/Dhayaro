'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/ui/logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { useAuthStore } from '@/store/auth-store'
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode, setCommandPaletteOpen, notifications } =
    useAppStore()
  const { user, logout } = useAuthStore()

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-50 flex h-16 items-center border-b border-border bg-card/80 backdrop-blur-xl',
        'left-0 transition-all duration-300',
        sidebarOpen ? 'lg:left-[280px]' : 'lg:left-[72px]'
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="hidden items-center gap-2 sm:flex">
          <Logo className="h-6 w-6" />
          <h1 className="text-sm font-semibold text-foreground">Dhayaro</h1>
        </div>
      </div>

      <div className="mx-auto hidden md:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-64 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Recherche...</span>
          <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1 px-4">
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-[10px]">
                  {unreadCount} non lues
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-y-auto">
                {[
                  { id: 1, title: 'Nouveau cas clinique ajouté', time: 'Il y a 5 min' },
                  { id: 2, title: 'Rapport mensuel disponible', time: 'Il y a 1 h' },
                  { id: 3, title: 'Synchronisation terminée', time: 'Il y a 3 h' },
                ].map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center text-sm text-primary"
                onClick={() => router.push('/notifications')}
              >
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{darkMode ? 'Mode clair' : 'Mode sombre'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-full pl-1 pr-2 text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">{user?.name ?? 'Utilisateur'}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email ?? 'email@dhayaro.cd'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header
