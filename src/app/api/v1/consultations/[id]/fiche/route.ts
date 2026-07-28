import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { consultations, patients, users, facilities } from '@/lib/schema'
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

    const [consultation] = await getDb()
      .select()
      .from(consultations)
      .where(eq(consultations.id, id))
      .limit(1)

    if (!consultation) {
      return apiError(404, 'Consultation not found')
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, consultation.patientId))
      .limit(1)

    const [doctor] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, consultation.doctorId))
      .limit(1)

    const facility = consultation.facilityId
      ? (await getDb().select().from(facilities).where(eq(facilities.id, consultation.facilityId)).limit(1))[0] ?? null
      : null

    return NextResponse.json({
      consultation: {
        id: consultation.id,
        consultationNumber: consultation.consultationNumber,
        motif: consultation.motif,
        symptoms: consultation.symptoms,
        vitalSigns: consultation.vitalSigns,
        notes: consultation.notes,
        provisionalDiagnosis: consultation.provisionalDiagnosis,
        status: consultation.status,
        createdAt: consultation.createdAt,
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
    logError('GET /consultations/[id]/fiche', e)
    return apiError(500, 'Internal server error')
  }
}
