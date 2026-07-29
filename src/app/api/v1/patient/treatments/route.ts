import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, treatments, users } from '@/lib/schema'
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

    const where = eq(treatments.patientId, patient.id)
    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(treatments).where(where),
      getDb().select({
        id: treatments.id, description: treatments.description, status: treatments.status,
        startDate: treatments.startDate, endDate: treatments.endDate, notes: treatments.notes,
        createdAt: treatments.createdAt,
        doctorFirstname: users.firstname, doctorLastname: users.lastname,
      }).from(treatments).leftJoin(users, eq(treatments.doctorId, users.id))
        .where(where).orderBy(desc(treatments.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /patient/treatments', e)
    return apiError(500, 'Erreur interne')
  }
}
