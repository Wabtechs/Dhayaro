'use client'

import { Providers } from '@/app/providers'
import { LaboratoryView } from '@/views/laboratory'

export default function LaboratoryPage() {
  return (
    <Providers>
      <LaboratoryView />
    </Providers>
  )
}
