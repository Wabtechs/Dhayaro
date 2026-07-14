import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases } from '@/lib/schema'
import { count } from 'drizzle-orm'

export async function GET() {
  try {
    const rows = await getDb()
      .select({
        status: clinicalCases.outcomeStatus,
        value: count(),
      })
      .from(clinicalCases)
      .groupBy(clinicalCases.outcomeStatus)

    const stats = {
      total: 0,
      pending: 0,
      in_progress: 0,
      success: 0,
      failure: 0,
    }

    for (const row of rows) {
      stats.total += row.value
      switch (row.status) {
        case 'PENDING':
          stats.pending = row.value
          break
        case 'IN_PROGRESS':
          stats.in_progress = row.value
          break
        case 'SUCCESS':
          stats.success = row.value
          break
        case 'FAILURE':
          stats.failure = row.value
          break
      }
    }

    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
