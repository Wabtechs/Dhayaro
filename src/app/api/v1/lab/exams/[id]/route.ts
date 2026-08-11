import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams, patients, users, labCategories } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { createClinicalDocument, documentExistsForEntity } from '@/lib/documents'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody, labExamUpdateSchema } from '@/lib/api-schemas'

const EXAM_KEYS = ['labTechnicianId', 'categoryId', 'consultationId', 'examName', 'clinicalIndication', 'status', 'results', 'resultNotes', 'validatedBy', 'validatedAt', 'completedAt'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb()
      .select({
        id: labExams.id,
        facilityId: labExams.facilityId,
        patientId: labExams.patientId,
        doctorId: labExams.doctorId,
        labTechnicianId: labExams.labTechnicianId,
        categoryId: labExams.categoryId,
        consultationId: labExams.consultationId,
        episodeId: labExams.episodeId,
        examName: labExams.examName,
        clinicalIndication: labExams.clinicalIndication,
        status: labExams.status,
        results: labExams.results,
        resultNotes: labExams.resultNotes,
        validatedBy: labExams.validatedBy,
        validatedAt: labExams.validatedAt,
        requestedAt: labExams.requestedAt,
        completedAt: labExams.completedAt,
        createdAt: labExams.createdAt,
        updatedAt: labExams.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
        categoryName: labCategories.name,
      })
      .from(labExams)
      .leftJoin(patients, eq(labExams.patientId, patients.id))
      .leftJoin(users, eq(labExams.doctorId, users.id))
      .leftJoin(labCategories, eq(labExams.categoryId, labCategories.id))
      .where(eq(labExams.id, validId))
      .limit(1)

    if (!row) {
      return apiError(404, 'Lab exam not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /lab/exams/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'LABORATORY'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const parsed = await parseJsonBody(request, labExamUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({
      id: labExams.id,
      doctorId: labExams.doctorId,
      examName: labExams.examName,
      status: labExams.status,
    }).from(labExams).where(eq(labExams.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Lab exam not found')
    }

    if (body.status === 'COMPLETED' && !body.results) {
      return apiError(400, 'results are required when marking exam as COMPLETED')
    }

    const allowedFields = pickAllowedKeys(body, EXAM_KEYS)

    if (body.status === 'COMPLETED' && !allowedFields.completedAt) {
      allowedFields.completedAt = new Date()
    }

    if (body.status === 'COMPLETED' || body.results) {
      if (!allowedFields.validatedBy) {
        allowedFields.validatedBy = auth.user.sub
      }
      if (!allowedFields.validatedAt) {
        allowedFields.validatedAt = new Date()
      }
    }

    if (body.labTechnicianId) {
      const techId = body.labTechnicianId
      allowedFields.labTechnicianId = techId
    }
    if (body.categoryId) {
      allowedFields.categoryId = body.categoryId
    }
    if (body.consultationId) {
      allowedFields.consultationId = body.consultationId
    }

    const [updated] = await getDb()
      .update(labExams)
      .set(allowedFields)
      .where(eq(labExams.id, validId))
      .returning()

    await logAudit(auth.user, 'UPDATE', 'lab_exam', validId, { ...allowedFields })

    if (allowedFields.status) {
      const statusEventMap: Record<string, 'LAB_EXAM_STARTED' | 'LAB_EXAM_COMPLETED' | 'LAB_EXAM_CANCELLED'> = {
        IN_PROGRESS: 'LAB_EXAM_STARTED',
        COMPLETED: 'LAB_EXAM_COMPLETED',
        CANCELLED: 'LAB_EXAM_CANCELLED',
      }
      const eventType = statusEventMap[allowedFields.status as string]
      if (eventType) {
        await logPatientEvent({
          facilityId: updated.facilityId,
          patientId: updated.patientId,
          episodeId: updated.episodeId,
          eventType,
          title: EVENT_TITLES[eventType],
          description: `Examen "${updated.examName}" - Nouveau statut: ${allowedFields.status}`,
          performedBy: auth.user.sub,
          performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
          metadata: { labExamId: updated.id, previousStatus: existing[0].status, newStatus: allowedFields.status },
        })
      }
    }

    if (body.status === 'COMPLETED' && existing[0].status !== 'COMPLETED') {
      await sendNotification({
        userId: existing[0].doctorId,
        facilityId: updated.facilityId,
        title: 'Résultat de laboratoire disponible',
        message: `Les résultats pour "${existing[0].examName}" sont disponibles.`,
        type: 'SUCCESS',
        link: `/laboratory/${validId}`,
        metadata: { labExamId: validId, examName: existing[0].examName },
      })

      await logPatientEvent({
        facilityId: updated.facilityId,
        patientId: updated.patientId,
        episodeId: updated.episodeId,
        eventType: 'LAB_EXAM_VALIDATED',
        title: EVENT_TITLES.LAB_EXAM_VALIDATED,
        description: `Examen "${updated.examName}" validé par ${auth.user.firstname} ${auth.user.lastname}`,
        performedBy: auth.user.sub,
        performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
        metadata: { labExamId: updated.id, validatedBy: auth.user.sub },
      })

      const resultExists = await documentExistsForEntity('consultationId', updated.consultationId || '', 'LAB_RESULT')
      if (updated.consultationId && !resultExists) {
        await createClinicalDocument({
          facilityId: updated.facilityId,
          patientId: updated.patientId,
          doctorId: updated.doctorId,
          episodeId: updated.episodeId,
          consultationId: updated.consultationId,
          documentType: 'LAB_RESULT',
          title: `Résultat de laboratoire - ${updated.examName}`,
          content: {
            labExamId: updated.id,
            examName: updated.examName,
            clinicalIndication: updated.clinicalIndication,
            results: updated.results,
            resultNotes: updated.resultNotes,
            validatedBy: updated.validatedBy,
            validatedAt: updated.validatedAt?.toISOString(),
            completedAt: updated.completedAt?.toISOString(),
          },
        })
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /lab/exams/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const existing = await getDb().select({ 
      id: labExams.id,
      patientId: labExams.patientId,
      episodeId: labExams.episodeId,
      facilityId: labExams.facilityId,
      examName: labExams.examName,
    }).from(labExams).where(eq(labExams.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Lab exam not found')
    }

    await getDb().update(labExams).set({ isActive: false, updatedAt: new Date() }).where(eq(labExams.id, validId))

    await logAudit(auth.user, 'DELETE', 'lab_exam', validId)

    await logPatientEvent({
      facilityId: existing[0].facilityId,
      patientId: existing[0].patientId,
      episodeId: existing[0].episodeId,
      eventType: 'LAB_EXAM_CANCELLED',
      title: EVENT_TITLES.LAB_EXAM_CANCELLED,
      description: `Examen "${existing[0].examName}" annulé`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { labExamId: existing[0].id },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /lab/exams/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
