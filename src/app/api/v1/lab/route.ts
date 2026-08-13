import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams } from '@/lib/schema'
import { count } from 'drizzle-orm'
import { addFacilityFilter, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const facilityFilter = addFacilityFilter(labExams.facilityId, auth, searchParams)

    const rows = await getDb()
      .select({ status: labExams.status, value: count() })
      .from(labExams)
      .where(facilityFilter)
      .groupBy(labExams.status)

    return NextResponse.json({
      service: 'lab',
      endpoints: ['/lab/exams', '/lab/categories'],
      summary: {
        exams: rows.reduce((total, row) => total + Number(row.value), 0),
        byStatus: Object.fromEntries(rows.map((row) => [row.status, Number(row.value)])),
      },
    })
  } catch (e) {
    return handleEndpointError(e, 'GET /lab')
  }
}
