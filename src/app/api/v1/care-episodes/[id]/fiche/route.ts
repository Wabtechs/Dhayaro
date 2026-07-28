import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes, patients, users, facilities, episodeEntities, consultations, diagnostics, labExams, treatments, prescriptions, medications } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
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

    const [episode] = await getDb()
      .select()
      .from(careEpisodes)
      .where(eq(careEpisodes.id, id))
      .limit(1)

    if (!episode) {
      return apiError(404, 'Care episode not found')
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.id, episode.patientId))
      .limit(1)

    const facility = episode.facilityId
      ? (await getDb().select().from(facilities).where(eq(facilities.id, episode.facilityId)).limit(1))[0] ?? null
      : null

    const entities = await getDb()
      .select()
      .from(episodeEntities)
      .where(eq(episodeEntities.episodeId, id))

    const consultationsList = await getDb()
      .select({
        id: consultations.id,
        consultationNumber: consultations.consultationNumber,
        motif: consultations.motif,
        notes: consultations.notes,
        status: consultations.status,
        createdAt: consultations.createdAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.doctorId, users.id))
      .where(eq(consultations.episodeId, id))

    const diagnosticsList = await getDb()
      .select({
        id: diagnostics.id,
        diagnosticType: diagnostics.diagnosticType,
        description: diagnostics.description,
        notes: diagnostics.notes,
        createdAt: diagnostics.createdAt,
      })
      .from(diagnostics)
      .where(eq(diagnostics.episodeId, id))

    const examsList = await getDb()
      .select({
        id: labExams.id,
        examName: labExams.examName,
        status: labExams.status,
        results: labExams.results,
        resultNotes: labExams.resultNotes,
        createdAt: labExams.createdAt,
      })
      .from(labExams)
      .where(eq(labExams.episodeId, id))

    const treatmentsList = await getDb()
      .select({
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
      .where(eq(treatments.patientId, episode.patientId))
      .orderBy(treatments.createdAt)

    const prescriptionsList = await getDb()
      .select({
        id: prescriptions.id,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        quantity: prescriptions.quantity,
        medicationName: medications.name,
      })
      .from(prescriptions)
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .leftJoin(treatments, eq(prescriptions.treatmentId, treatments.id))
      .where(eq(treatments.patientId, episode.patientId))

    return NextResponse.json({
      episode: {
        id: episode.id,
        episodeNumber: episode.episodeNumber,
        status: episode.status,
        admitDate: episode.admitDate,
        dischargeDate: episode.dischargeDate,
        admitReason: episode.admitReason,
        dischargeSummary: episode.dischargeSummary,
        dischargeOutcome: episode.dischargeOutcome,
        metadata: episode.metadata,
        createdAt: episode.createdAt,
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
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        city: facility.city,
      } : null,
      consultations: consultationsList,
      diagnostics: diagnosticsList,
      exams: examsList,
      treatments: treatmentsList,
      prescriptions: prescriptionsList,
    })
  } catch (e) {
    logError('GET /care-episodes/[id]/fiche', e)
    return apiError(500, 'Internal server error')
  }
}
