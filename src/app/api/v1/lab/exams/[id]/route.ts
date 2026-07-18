import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams, patients, users, labCategories } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const EXAM_KEYS = ['labTechnicianId', 'categoryId', 'consultationId', 'examName', 'clinicalIndication', 'status', 'results', 'resultNotes', 'validatedBy', 'validatedAt', 'completedAt'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const [row] = await getDb()
      .select({
        id: labExams.id,
        facilityId: labExams.facilityId,
        patientId: labExams.patientId,
        doctorId: labExams.doctorId,
        labTechnicianId: labExams.labTechnicianId,
        categoryId: labExams.categoryId,
        consultationId: labExams.consultationId,
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
      .where(eq(labExams.id, id))
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
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    const existing = await getDb().select({ id: labExams.id }).from(labExams).where(eq(labExams.id, id)).limit(1)
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
      .where(eq(labExams.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /lab/exams/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
