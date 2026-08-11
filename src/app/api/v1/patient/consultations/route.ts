import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, consultations, users } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError, parsePagination, handleEndpointError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') return apiError(403, 'Accès réservé aux patients')

    const [patient] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, auth.user.sub)).limit(1)
    if (!patient) return apiError(404, 'Profil patient introuvable')

    const { page, size, offset } = parsePagination(new URL(request.url).searchParams)

    const where = eq(consultations.patientId, patient.id)
    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(consultations).where(where),
      getDb().select({
        id: consultations.id, consultationNumber: consultations.consultationNumber,
        motif: consultations.motif, status: consultations.status, notes: consultations.notes,
        createdAt: consultations.createdAt, updatedAt: consultations.updatedAt,
        doctorFirstname: users.firstname, doctorLastname: users.lastname,
      }).from(consultations).leftJoin(users, eq(consultations.doctorId, users.id))
        .where(where).orderBy(desc(consultations.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /patient/consultations')
  }
}
