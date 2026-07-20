'use client'


import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { CommandPalette } from './command-palette'
import { useAppStore } from '@/store'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <div className="relative min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={toggleSidebar}>
          <SheetContent side="left" className="w-[280px] p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <Header />

      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[72px]"
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      <CommandPalette />
    </div>
  )
}
