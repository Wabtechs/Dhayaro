'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useAppStore } from "@/store";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  FolderOpen,
  ClipboardList,
  BarChart3,
  FlaskConical,
  Settings,
  Plus,
  FileText,
  Search,
} from "lucide-react";

interface CommandItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  shortcut?: string;
  onSelect?: () => void;
}

const navigationItems: CommandItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", shortcut: "D" },
  {
    icon: Building2,
    label: "Établissements",
    href: "/facilities",
    shortcut: "E",
  },
  {
    icon: Users,
    label: "Utilisateurs",
    href: "/users",
    shortcut: "U",
  },
  { icon: UserRound, label: "Patients", href: "/patients", shortcut: "P" },
  {
    icon: FolderOpen,
    label: "Cas Cliniques",
    href: "/clinical-cases",
    shortcut: "C",
  },
  {
    icon: ClipboardList,
    label: "Historique des Traitements",
    href: "/treatment-history",
  },
  {
    icon: BarChart3,
    label: "Statistiques",
    href: "/analytics",
  },
  {
    icon: FlaskConical,
    label: "Chercheurs",
    href: "/research",
  },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

const actionItems: CommandItem[] = [
  {
    icon: Plus,
    label: "Créer un cas clinique",
    href: "/clinical-cases",
    shortcut: "⌘N",
  },
  {
    icon: Plus,
    label: "Ajouter un patient",
    href: "/patients",
    shortcut: "⌘P",
  },
  {
    icon: FileText,
    label: "Générer un rapport",
    shortcut: "⌘R",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!useAppStore.getState().commandPaletteOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  const handleSelect = (href?: string, label?: string) => {
    setCommandPaletteOpen(false);
    if (href) {
      router.push(href);
    } else if (label) {
      toast({ title: label, description: "Cette fonctionnalité sera bientôt disponible." });
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 px-4">
        <Command
          className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Rechercher..."
              className="h-12 w-full bg-transparent pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group
              heading="Navigation"
              className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5"
            >
              {navigationItems.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions */}
            <Command.Group
              heading="Actions"
              className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground [&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5"
            >
              {actionItems.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.href, !item.href ? item.label : undefined)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export default CommandPalette;
