import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, diagnostics, diseases, users } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiErrorResponse, parsePagination, handleEndpointError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') return apiErrorResponse('ACCESS_DENIED', 403)

    const [patient] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, auth.user.sub)).limit(1)
    if (!patient) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const { page, size, offset } = parsePagination(new URL(request.url).searchParams)

    const where = and(eq(diagnostics.patientId, patient.id), eq(diagnostics.isActive, true))
    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(diagnostics).where(where),
      getDb().select({
        id: diagnostics.id,
        diagnosticType: diagnostics.diagnosticType,
        description: diagnostics.description,
        notes: diagnostics.notes,
        isValidated: diagnostics.isValidated,
        diseaseCode: diseases.code,
        diseaseName: diseases.name,
        createdAt: diagnostics.createdAt,
        updatedAt: diagnostics.updatedAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      }).from(diagnostics)
        .leftJoin(diseases, eq(diagnostics.diseaseId, diseases.id))
        .leftJoin(users, eq(diagnostics.doctorId, users.id))
        .where(where).orderBy(desc(diagnostics.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    return handleEndpointError(e, 'GET /patient/diagnostics')
  }
}
