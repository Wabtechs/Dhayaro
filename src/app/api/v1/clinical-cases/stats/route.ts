import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases } from '@/lib/schema'
import { and, count } from 'drizzle-orm'
import { addFacilityFilter } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const conditions = []
    const facilityFilter = addFacilityFilter(clinicalCases.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await getDb()
      .select({
        status: clinicalCases.outcomeStatus,
        value: count(),
      })
      .from(clinicalCases)
      .where(whereClause)
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
