'use client'

import { Providers } from '@/app/providers'
import { DiseasesView } from '@/views/diseases'

export default function DiseasesPage() {
  return (
    <Providers>
      <DiseasesView />
    </Providers>
  )
}
