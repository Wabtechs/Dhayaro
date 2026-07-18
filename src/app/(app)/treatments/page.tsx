'use client'

import { Providers } from '@/app/providers'
import { TreatmentsView } from '@/views/treatments'

export default function TreatmentsPage() {
  return (
    <Providers>
      <TreatmentsView />
    </Providers>
  )
}
