import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { consultations, patients, users, diagnostics, treatments, labExams, diseases } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const CONSULTATION_KEYS = ['motif', 'symptoms', 'vitalSigns', 'notes', 'provisionalDiagnosis', 'status', 'isFollowUp', 'previousConsultationId', 'facilityId', 'patientId', 'doctorId'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select({
      id: consultations.id,
      facilityId: consultations.facilityId,
      patientId: consultations.patientId,
      doctorId: consultations.doctorId,
      consultationNumber: consultations.consultationNumber,
      motif: consultations.motif,
      symptoms: consultations.symptoms,
      vitalSigns: consultations.vitalSigns,
      notes: consultations.notes,
      provisionalDiagnosis: consultations.provisionalDiagnosis,
      status: consultations.status,
      isFollowUp: consultations.isFollowUp,
      previousConsultationId: consultations.previousConsultationId,
      createdAt: consultations.createdAt,
      updatedAt: consultations.updatedAt,
      patientFirstname: patients.firstname,
      patientLastname: patients.lastname,
      doctorFirstname: users.firstname,
      doctorLastname: users.lastname,
    })
    .from(consultations)
    .leftJoin(patients, eq(consultations.patientId, patients.id))
    .leftJoin(users, eq(consultations.doctorId, users.id))
    .where(eq(consultations.id, id))
    .limit(1)

    if (!row) {
      return apiError(404, 'Consultation not found')
    }

    const [relatedDiagnostics, relatedTreatments, relatedLabExams] = await Promise.all([
      getDb().select({
        id: diagnostics.id,
        diagnosticType: diagnostics.diagnosticType,
        description: diagnostics.description,
        notes: diagnostics.notes,
        isValidated: diagnostics.isValidated,
        diseaseName: diseases.name,
        createdAt: diagnostics.createdAt,
      })
      .from(diagnostics)
      .leftJoin(diseases, eq(diagnostics.diseaseId, diseases.id))
      .where(eq(diagnostics.consultationId, id)),
      getDb().select({
        id: treatments.id,
        description: treatments.description,
        status: treatments.status,
        startDate: treatments.startDate,
        endDate: treatments.endDate,
        notes: treatments.notes,
        outcome: treatments.outcome,
        createdAt: treatments.createdAt,
      })
      .from(treatments)
      .where(eq(treatments.consultationId, id)),
      getDb().select({
        id: labExams.id,
        examName: labExams.examName,
        clinicalIndication: labExams.clinicalIndication,
        status: labExams.status,
        results: labExams.results,
        resultNotes: labExams.resultNotes,
        requestedAt: labExams.requestedAt,
        completedAt: labExams.completedAt,
        createdAt: labExams.createdAt,
      })
      .from(labExams)
      .where(eq(labExams.consultationId, id)),
    ])

    return NextResponse.json({
      ...row,
      diagnostics: relatedDiagnostics,
      treatments: relatedTreatments,
      labExams: relatedLabExams,
    })
  } catch (e) {
    logError('GET /consultations/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    if (body.patientId) {
      const patientId = sanitizeUuid(body.patientId)
      if (!patientId) return apiError(400, 'Invalid patientId')
    }
    if (body.doctorId) {
      const doctorId = sanitizeUuid(body.doctorId)
      if (!doctorId) return apiError(400, 'Invalid doctorId')
    }

    const allowedFields = pickAllowedKeys(body, CONSULTATION_KEYS)

    const [updated] = await getDb()
      .update(consultations)
      .set(allowedFields)
      .where(eq(consultations.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Consultation not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /consultations/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [deleted] = await getDb()
      .update(consultations)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(consultations.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'Consultation not found')
    }

    return NextResponse.json({ detail: 'Consultation cancelled' })
  } catch (e) {
    logError('DELETE /consultations/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
