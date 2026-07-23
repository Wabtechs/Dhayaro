import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments, prescriptions, medications, patients, users, facilities } from '@/lib/schema'
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

    const [treatment] = await getDb()
      .select()
      .from(treatments)
      .where(eq(treatments.id, id))
      .limit(1)

    if (!treatment) {
      return apiError(404, 'Treatment not found')
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
      .where(eq(prescriptions.treatmentId, id))

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, treatment.patientId))
      .limit(1)

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
    logError('GET /treatments/[id]/ordonnance', e)
    return apiError(500, 'Internal server error')
  }
}
