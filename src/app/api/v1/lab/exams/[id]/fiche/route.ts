import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams, patients, users, facilities, labCategories } from '@/lib/schema'
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
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { examId: "L'identifiant de l'examen est invalide." })

    const [exam] = await getDb()
      .select()
      .from(labExams)
      .where(eq(labExams.id, validId))
      .limit(1)

    if (!exam) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, exam.patientId))
      .limit(1)

    const [doctor] = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, exam.doctorId))
      .limit(1)

    const facility = exam.facilityId
      ? (await getDb().select().from(facilities).where(eq(facilities.id, exam.facilityId)).limit(1))[0] ?? null
      : null

    const category = exam.categoryId
      ? (await getDb().select().from(labCategories).where(eq(labCategories.id, exam.categoryId)).limit(1))[0] ?? null
      : null

    return NextResponse.json({
      exam: {
        id: exam.id,
        examName: exam.examName,
        clinicalIndication: exam.clinicalIndication,
        status: exam.status,
        results: exam.results,
        resultNotes: exam.resultNotes,
        validatedAt: exam.validatedAt,
        requestedAt: exam.requestedAt,
        completedAt: exam.completedAt,
        createdAt: exam.createdAt,
      },
      category: category ? {
        id: category.id,
        name: category.name,
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
return handleEndpointError(e, 'GET /lab/exams/[id]/fiche')
  }
}
