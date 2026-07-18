import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labExams, patients, users, labCategories } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const categoryId = sanitizeUuid(searchParams.get('categoryId'))
    const status = searchParams.get('status')

    const conditions = []

    if (patientId) {
      conditions.push(eq(labExams.patientId, patientId))
    }
    if (categoryId) {
      conditions.push(eq(labExams.categoryId, categoryId))
    }
    if (status) {
      conditions.push(eq(labExams.status, status as 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'))
    }

    if (auth.user.facilityId && ['DOCTOR', 'SPECIALIST', 'LABORATORY', 'NURSE'].includes(auth.user.role)) {
      conditions.push(eq(labExams.facilityId, auth.user.facilityId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(labExams).where(whereClause),
      getDb()
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
        .where(whereClause)
        .orderBy(desc(labExams.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /lab/exams', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.patientId || !body.examName) {
      return apiError(400, 'patientId and examName are required')
    }

    const patientId = sanitizeUuid(body.patientId)
    if (!patientId) {
      return apiError(400, 'Invalid patientId')
    }

    const patientCheck = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }

    if (body.categoryId) {
      const catId = sanitizeUuid(body.categoryId)
      if (!catId) {
        return apiError(400, 'Invalid categoryId')
      }
      const catCheck = await getDb().select({ id: labCategories.id }).from(labCategories).where(eq(labCategories.id, catId)).limit(1)
      if (catCheck.length === 0) {
        return apiError(400, 'Lab category not found')
      }
    }

    const now = new Date()

    const [row] = await getDb().insert(labExams).values({
      id: crypto.randomUUID(),
      facilityId: auth.user.facilityId || null,
      patientId,
      doctorId: auth.user.sub,
      labTechnicianId: sanitizeUuid(body.labTechnicianId) || null,
      categoryId: sanitizeUuid(body.categoryId) || null,
      consultationId: sanitizeUuid(body.consultationId) || null,
      examName: body.examName,
      clinicalIndication: body.clinicalIndication || null,
      status: 'REQUESTED',
      results: body.results || {},
      resultNotes: body.resultNotes || null,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /lab/exams', e)
    return apiError(500, 'Internal server error')
  }
}
