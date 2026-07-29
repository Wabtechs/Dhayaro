import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, labExams, labCategories } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError, logError, parsePagination } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') return apiError(403, 'Accès réservé aux patients')

    const [patient] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, auth.user.sub)).limit(1)
    if (!patient) return apiError(404, 'Profil patient introuvable')

    const { page, size, offset } = parsePagination(new URL(request.url).searchParams)

    const where = eq(labExams.patientId, patient.id)
    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(labExams).where(where),
      getDb().select({
        id: labExams.id, examName: labExams.examName, status: labExams.status,
        results: labExams.results, resultNotes: labExams.resultNotes,
        clinicalIndication: labExams.clinicalIndication,
        requestedAt: labExams.requestedAt, completedAt: labExams.completedAt,
        categoryName: labCategories.name,
      }).from(labExams).leftJoin(labCategories, eq(labExams.categoryId, labCategories.id))
        .where(where).orderBy(desc(labExams.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /patient/lab-exams', e)
    return apiError(500, 'Erreur interne')
  }
}
