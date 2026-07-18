'use client'

import { Providers } from '@/app/providers'
import { ArchivesView } from '@/views/archives'

export default function ArchivesPage() {
  return (
    <Providers>
      <ArchivesView />
    </Providers>
  )
}
