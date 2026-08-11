import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { diagnostics, patients, users, facilities, diseases } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { diagnosisId: "L'identifiant du diagnostic est invalide." })

    const [diagnostic] = await getDb()
      .select()
      .from(diagnostics)
      .where(eq(diagnostics.id, validId))
      .limit(1)

    if (!diagnostic) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, diagnostic.patientId))
      .limit(1)

    const [doctor] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, diagnostic.doctorId))
      .limit(1)

    const facility = diagnostic.facilityId
      ? (await getDb().select().from(facilities).where(eq(facilities.id, diagnostic.facilityId)).limit(1))[0] ?? null
      : null

    const disease = diagnostic.diseaseId
      ? (await getDb().select().from(diseases).where(eq(diseases.id, diagnostic.diseaseId)).limit(1))[0] ?? null
      : null

    return NextResponse.json({
      diagnostic: {
        id: diagnostic.id,
        diagnosticType: diagnostic.diagnosticType,
        description: diagnostic.description,
        notes: diagnostic.notes,
        isValidated: diagnostic.isValidated,
        validatedAt: diagnostic.validatedAt,
        createdAt: diagnostic.createdAt,
      },
      disease: disease ? {
        id: disease.id,
        code: disease.code,
        name: disease.name,
      } : null,
      patient: patient ? {
        id: patient.id,
        firstname: patient.firstname,
        lastname: patient.lastname,
        dateOfBirth: patient.dateOfBirth,
        sex: patient.sex,
        phone: patient.phone,
        address: patient.address,
        city: patient.city,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
      } : null,
      doctor: doctor ? {
        id: doctor.id,
        firstname: doctor.firstname,
        lastname: doctor.lastname,
        specialty: doctor.specialty,
        phone: doctor.phone,
      } : null,
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        city: facility.city,
      } : null,
    })
  } catch (e) {
return handleEndpointError(e, 'GET /diagnostics/[id]/fiche')
  }
}
