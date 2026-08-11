import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, treatments, prescriptions, medications, users, facilities } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
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
    if (auth.user.role !== 'PATIENT') return apiErrorResponse('ACCESS_DENIED', 403)

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { treatmentId: "L'identifiant du traitement est invalide." })

    const [patient] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, auth.user.sub)).limit(1)
    if (!patient) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const [treatment] = await getDb()
      .select()
      .from(treatments)
      .where(and(eq(treatments.id, validId), eq(treatments.patientId, patient.id)))
      .limit(1)

    if (!treatment) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    const treatmentPrescriptions = await getDb()
      .select({
        id: prescriptions.id,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        quantity: prescriptions.quantity,
        medicationName: medications.name,
        medicationGenericName: medications.genericName,
        medicationForm: medications.form,
        medicationDosage: medications.dosage,
      })
      .from(prescriptions)
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .where(eq(prescriptions.treatmentId, validId))

    const [doctor] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, treatment.doctorId))
      .limit(1)

    const [facility] = treatment.facilityId
      ? await getDb()
          .select()
          .from(facilities)
          .where(eq(facilities.id, treatment.facilityId))
          .limit(1)
      : [null]

    const [treatmentPatient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, treatment.patientId))
      .limit(1)

    return NextResponse.json({
      treatment: {
        id: treatment.id,
        description: treatment.description,
        status: treatment.status,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
        notes: treatment.notes,
        outcome: treatment.outcome,
        createdAt: treatment.createdAt,
      },
      prescriptions: treatmentPrescriptions,
      patient: treatmentPatient ? {
        id: treatmentPatient.id,
        firstname: treatmentPatient.firstname,
        lastname: treatmentPatient.lastname,
        dateOfBirth: treatmentPatient.dateOfBirth,
        sex: treatmentPatient.sex,
        phone: treatmentPatient.phone,
        address: treatmentPatient.address,
        city: treatmentPatient.city,
        bloodGroup: treatmentPatient.bloodGroup,
        allergies: treatmentPatient.allergies,
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
    return handleEndpointError(e, 'GET /patient/treatments/[id]/ordonnance')
  }
}
