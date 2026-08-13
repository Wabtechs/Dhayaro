'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth-store'
import { PwaManager } from '@/components/pwa/pwa-manager'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1 },
    },
  }))

  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    api.setTokenListener(setToken)
  }, [setToken])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
        <PwaManager />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
