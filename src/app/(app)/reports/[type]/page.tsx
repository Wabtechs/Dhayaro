'use client'

import { use } from 'react'
import { ReportDetailView } from '@/views/report-detail'

export default function ReportTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  return <ReportDetailView type={type} />
}
