import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diseaseStatistics, diseases } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const diseaseId = sanitizeUuid(searchParams.get('diseaseId'))

    const conditions = []
    if (diseaseId) conditions.push(eq(diseaseStatistics.diseaseId, diseaseId))

    const whereClause = conditions.length > 0 ? eq(diseaseStatistics.diseaseId, diseaseId) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(diseaseStatistics).where(whereClause),
      getDb().select({
        id: diseaseStatistics.id,
        diseaseId: diseaseStatistics.diseaseId,
        totalCases: diseaseStatistics.totalCases,
        recoveryRate: diseaseStatistics.recoveryRate,
        mortalityRate: diseaseStatistics.mortalityRate,
        avgHospitalizationDays: diseaseStatistics.avgHospitalizationDays,
        commonTreatments: diseaseStatistics.commonTreatments,
        commonMedications: diseaseStatistics.commonMedications,
        commonExams: diseaseStatistics.commonExams,
        commonComplications: diseaseStatistics.commonComplications,
        lastCalculated: diseaseStatistics.lastCalculated,
        createdAt: diseaseStatistics.createdAt,
        updatedAt: diseaseStatistics.updatedAt,
        diseaseName: diseases.name,
        diseaseCode: diseases.code,
        diseaseCategory: diseases.category,
      })
      .from(diseaseStatistics)
      .leftJoin(diseases, eq(diseaseStatistics.diseaseId, diseases.id))
      .where(whereClause)
      .orderBy(desc(diseaseStatistics.totalCases))
      .limit(size)
      .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /disease-statistics', e)
    return apiError(500, 'Internal server error')
  }
}
