'use client'

import { use } from 'react'
import CareEpisodeDetail from '@/views/care-episode-detail'

export default function CareEpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return <CareEpisodeDetail id={resolvedParams.id} />
}
