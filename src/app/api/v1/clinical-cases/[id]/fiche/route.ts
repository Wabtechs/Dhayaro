import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [clinicalCase] = await getDb()
      .select()
      .from(clinicalCases)
      .where(eq(clinicalCases.id, id))
      .limit(1)

    if (!clinicalCase) {
      return apiError(404, 'Clinical case not found')
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, clinicalCase.patientId))
      .limit(1)

    const [doctor] = clinicalCase.doctorId
      ? await getDb().select().from(users).where(eq(users.id, clinicalCase.doctorId)).limit(1)
      : []

    const facility = clinicalCase.facilityId
      ? (await getDb().select().from(facilities).where(eq(facilities.id, clinicalCase.facilityId)).limit(1))[0] ?? null
      : null

    return NextResponse.json({
      clinicalCase: {
        id: clinicalCase.id,
        title: clinicalCase.title,
        description: clinicalCase.description,
        symptomsJson: clinicalCase.symptomsJson,
        provisionalDiagnosis: clinicalCase.provisionalDiagnosis,
        treatment: clinicalCase.treatment,
        treatmentDuration: clinicalCase.treatmentDuration,
        outcomeStatus: clinicalCase.outcomeStatus,
        outcomeNotes: clinicalCase.outcomeNotes,
        priority: clinicalCase.priority,
        tagsJson: clinicalCase.tagsJson,
        createdAt: clinicalCase.createdAt,
      },
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
    logError('GET /clinical-cases/[id]/fiche', e)
    return apiError(500, 'Internal server error')
  }
}
