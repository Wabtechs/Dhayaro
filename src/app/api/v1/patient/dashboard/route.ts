import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, patients, consultations, diagnostics, treatments, labExams, documents, prescriptions, medications, facilities, queue } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError, logError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') {
      return apiError(403, 'Accès réservé aux patients')
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.userId, auth.user.sub))
      .limit(1)

    if (!patient) {
      return apiError(404, 'Profil patient introuvable')
    }

    const patientId = patient.id

    const [nextConsultation] = await getDb()
      .select({
        id: consultations.id,
        consultationNumber: consultations.consultationNumber,
        motif: consultations.motif,
        status: consultations.status,
        createdAt: consultations.createdAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.doctorId, users.id))
      .where(and(
        eq(consultations.patientId, patientId),
        eq(consultations.status, 'WAITING'),
      ))
      .orderBy(desc(consultations.createdAt))
      .limit(1)

    const [lastConsultation] = await getDb()
      .select({
        id: consultations.id,
        consultationNumber: consultations.consultationNumber,
        motif: consultations.motif,
        status: consultations.status,
        createdAt: consultations.createdAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.doctorId, users.id))
      .where(and(
        eq(consultations.patientId, patientId),
        eq(consultations.status, 'COMPLETED'),
      ))
      .orderBy(desc(consultations.createdAt))
      .limit(1)

    const [queueEntry] = await getDb()
      .select({
        id: queue.id,
        ticketNumber: queue.ticketNumber,
        status: queue.status,
        priority: queue.priority,
        queuePosition: queue.queuePosition,
        estimatedWaitMinutes: queue.estimatedWaitMinutes,
      })
      .from(queue)
      .where(and(
        eq(queue.patientId, patientId),
        eq(queue.status, 'WAITING'),
      ))
      .orderBy(desc(queue.createdAt))
      .limit(1)

    const activeTreatments = await getDb()
      .select({
        id: treatments.id,
        description: treatments.description,
        status: treatments.status,
        startDate: treatments.startDate,
        endDate: treatments.endDate,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(treatments)
      .leftJoin(users, eq(treatments.doctorId, users.id))
      .where(and(
        eq(treatments.patientId, patientId),
        eq(treatments.status, 'PRESCRIBED'),
      ))
      .orderBy(desc(treatments.createdAt))
      .limit(10)

    const recentLabExams = await getDb()
      .select({
        id: labExams.id,
        examName: labExams.examName,
        status: labExams.status,
        results: labExams.results,
        createdAt: labExams.createdAt,
        completedAt: labExams.completedAt,
      })
      .from(labExams)
      .where(eq(labExams.patientId, patientId))
      .orderBy(desc(labExams.createdAt))
      .limit(10)

    const recentDocuments = await getDb()
      .select({
        id: documents.id,
        title: documents.title,
        documentType: documents.documentType,
        createdAt: documents.createdAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(documents)
      .leftJoin(users, eq(documents.doctorId, users.id))
      .where(eq(documents.patientId, patientId))
      .orderBy(desc(documents.createdAt))
      .limit(10)

    const lastPrescriptions = await getDb()
      .select({
        id: treatments.id,
        description: treatments.description,
        startDate: treatments.startDate,
        endDate: treatments.endDate,
        status: treatments.status,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(treatments)
      .leftJoin(users, eq(treatments.doctorId, users.id))
      .where(and(
        eq(treatments.patientId, patientId),
        eq(treatments.status, 'PRESCRIBED'),
      ))
      .orderBy(desc(treatments.createdAt))
      .limit(5)

    const [totalConsultations] = await getDb()
      .select({ value: count() })
      .from(consultations)
      .where(eq(consultations.patientId, patientId))

    return NextResponse.json({
      nextConsultation: nextConsultation || null,
      lastConsultation: lastConsultation || null,
      queueEntry: queueEntry || null,
      activeTreatments,
      recentLabExams,
      recentDocuments,
      lastPrescriptions,
      totalConsultations: totalConsultations?.value ?? 0,
    })
  } catch (e) {
    logError('GET /patient/dashboard', e)
    return apiError(500, 'Erreur interne')
  }
}
