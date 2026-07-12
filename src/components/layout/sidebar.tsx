import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store";
import { useAuthStore } from "@/store/auth-store";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  FolderOpen,
  ClipboardList,
  BarChart3,
  FlaskConical,
  RefreshCw,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "PRINCIPAL",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
      { label: "Établissements", icon: Building2, href: "/app/facilities" },
      { label: "Utilisateurs", icon: Users, href: "/app/users" },
      { label: "Patients", icon: UserRound, href: "/app/patients" },
    ],
  },
  {
    label: "CLINIQUE",
    items: [
      { label: "Cas Cliniques", icon: FolderOpen, href: "/app/clinical-cases" },
      {
        label: "Historique des Traitements",
        icon: ClipboardList,
        href: "/app/treatment-history",
      },
    ],
  },
  {
    label: "ANALYTIQUE",
    items: [
      {
        label: "Statistiques",
        icon: BarChart3,
        href: "/app/analytics",
      },
      { label: "Chercheurs", icon: FlaskConical, href: "/app/research" },
    ],
  },
  {
    label: "SYSTÈME",
    items: [
      { label: "Synchronisation", icon: RefreshCw, href: "/app/sync" },
      { label: "Paramètres", icon: Settings, href: "/app/settings" },
      { label: "Journal d'Audit", icon: Shield, href: "/app/audit" },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen } = useAppStore();
  const { user, logout } = useAuthStore();

  const collapsed = !sidebarOpen;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300 dark:bg-slate-900",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <img src="/logo.png" alt="MedInsight" className="h-7 w-7 shrink-0 object-contain" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground">
            MedInsight
          </span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-6 px-3">
            {navSections.map((section) => (
              <div key={section.label}>
                {!collapsed && (
                  <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}
                  </span>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <NavLink
                              to={item.href}
                              className={({ isActive }) =>
                                cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                                  isActive &&
                                    "bg-primary/10 text-primary hover:bg-primary/15"
                                )
                              }
                            >
                              <item.icon className="h-5 w-5" />
                            </NavLink>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                              isActive &&
                                "bg-accent text-primary hover:bg-accent"
                            )
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <Separator />

      {/* User Info */}
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
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium">{user?.name ?? "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role ?? "Rôle"}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? "Utilisateur"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role ?? "Rôle"}
              </p>
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
  );
}

export default Sidebar;
