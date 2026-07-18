'use client'

import { Providers } from '@/app/providers'
import { DocumentsView } from '@/views/documents'

export default function DocumentsPage() {
  return (
    <Providers>
      <DocumentsView />
    </Providers>
  )
}
