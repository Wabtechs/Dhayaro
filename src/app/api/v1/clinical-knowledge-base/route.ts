import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalKnowledgeBase, diseases } from '@/lib/schema'
import { eq, desc, ilike, and, or, count, SQL } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions: SQL[] = []

    const diseaseId = sanitizeUuid(searchParams.get('diseaseId'))
    const sex = searchParams.get('sex')
    const ageRange = searchParams.get('ageRange')

    if (diseaseId) conditions.push(eq(clinicalKnowledgeBase.diseaseId, diseaseId))
    if (sex) conditions.push(eq(clinicalKnowledgeBase.sex, sex as 'M' | 'F' | 'OTHER'))
    if (ageRange) conditions.push(eq(clinicalKnowledgeBase.ageRange, ageRange))

    if (search) {
      conditions.push(or(
        ilike(clinicalKnowledgeBase.evolution, `%${search}%`),
        ilike(clinicalKnowledgeBase.outcome, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(clinicalKnowledgeBase.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(clinicalKnowledgeBase).where(whereClause),
      getDb().select({
        id: clinicalKnowledgeBase.id,
        sourceEpisodeId: clinicalKnowledgeBase.sourceEpisodeId,
        ageRange: clinicalKnowledgeBase.ageRange,
        sex: clinicalKnowledgeBase.sex,
        symptoms: clinicalKnowledgeBase.symptoms,
        diagnostics: clinicalKnowledgeBase.diagnostics,
        treatments: clinicalKnowledgeBase.treatments,
        examResults: clinicalKnowledgeBase.examResults,
        evolution: clinicalKnowledgeBase.evolution,
        durationDays: clinicalKnowledgeBase.durationDays,
        outcome: clinicalKnowledgeBase.outcome,
        diseaseId: clinicalKnowledgeBase.diseaseId,
        facilityId: clinicalKnowledgeBase.facilityId,
        isAnonymized: clinicalKnowledgeBase.isAnonymized,
        createdAt: clinicalKnowledgeBase.createdAt,
        diseaseName: diseases.name,
        diseaseCode: diseases.code,
      })
      .from(clinicalKnowledgeBase)
      .leftJoin(diseases, eq(clinicalKnowledgeBase.diseaseId, diseases.id))
      .where(whereClause)
      .orderBy(desc(clinicalKnowledgeBase.createdAt))
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
return handleEndpointError(e, 'GET /clinical-knowledge-base')
  }
}
