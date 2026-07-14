'use client'

import { Providers } from '@/app/providers'
import { AppShell } from '@/components/layout/app-shell'

export function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  )
}
