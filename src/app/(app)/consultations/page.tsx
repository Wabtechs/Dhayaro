'use client'

import { Providers } from '@/app/providers'
import { ConsultationsView } from '@/views/consultations'

export default function ConsultationsPage() {
  return (
    <Providers>
      <ConsultationsView />
    </Providers>
  )
}
