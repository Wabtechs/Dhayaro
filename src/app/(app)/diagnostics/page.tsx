'use client'

import { Providers } from '@/app/providers'
import { DiagnosticsView } from '@/views/diagnostics'

export default function DiagnosticsPage() {
  return (
    <Providers>
      <DiagnosticsView />
    </Providers>
  )
}
