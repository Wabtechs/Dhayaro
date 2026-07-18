'use client'

import { Providers } from '@/app/providers'
import { QueueView } from '@/views/queue'

export default function QueuePage() {
  return (
    <Providers>
      <QueueView />
    </Providers>
  )
}
