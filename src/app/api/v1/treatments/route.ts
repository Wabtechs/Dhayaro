import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments, patients, users } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(treatments.description, `%${search}%`),
        ilike(treatments.notes, `%${search}%`),
        ilike(treatments.outcome, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const consultationId = sanitizeUuid(searchParams.get('consultationId'))
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(treatments.patientId, patientId))
    if (doctorId) conditions.push(eq(treatments.doctorId, doctorId))
    if (consultationId) conditions.push(eq(treatments.consultationId, consultationId))
    if (status) conditions.push(eq(treatments.status, status as 'PRESCRIBED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED'))

    const facilityFilter = addFacilityFilter(treatments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(treatments).where(whereClause),
      getDb().select({
        id: treatments.id,
        facilityId: treatments.facilityId,
        consultationId: treatments.consultationId,
        patientId: treatments.patientId,
        doctorId: treatments.doctorId,
        diagnosisId: treatments.diagnosisId,
        description: treatments.description,
        status: treatments.status,
        startDate: treatments.startDate,
        endDate: treatments.endDate,
        notes: treatments.notes,
        outcome: treatments.outcome,
        createdAt: treatments.createdAt,
        updatedAt: treatments.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
      })
      .from(treatments)
      .leftJoin(patients, eq(treatments.patientId, patients.id))
      .leftJoin(users, eq(treatments.doctorId, users.id))
      .where(whereClause)
      .orderBy(desc(treatments.createdAt))
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
    logError('GET /treatments', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    const patientId = sanitizeUuid(body.patientId)
    const doctorId = sanitizeUuid(body.doctorId)

    if (!patientId) {
      return apiError(400, 'patientId is required and must be a valid UUID')
    }
    if (!doctorId) {
      return apiError(400, 'doctorId is required and must be a valid UUID')
    }
    if (!body.description) {
      return apiError(400, 'description is required')
    }
    if (!body.startDate) {
      return apiError(400, 'startDate is required')
    }

    const db = getDb()

    const [patientCheck, doctorCheck] = await Promise.all([
      db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1),
    ])

    if (patientCheck.length === 0) return apiError(400, 'Patient not found')
    if (doctorCheck.length === 0) return apiError(400, 'Doctor not found')

    const { facilityId } = enforceFacilityAccess(body, auth)
    const consultationId = sanitizeUuid(body.consultationId)
    const diagnosisId = sanitizeUuid(body.diagnosisId)
    const now = new Date()

    const [row] = await db.insert(treatments).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      consultationId: consultationId || null,
      patientId,
      doctorId,
      diagnosisId: diagnosisId || null,
      description: body.description,
      status: body.status || 'PRESCRIBED',
      startDate: body.startDate,
      endDate: body.endDate || null,
      notes: body.notes || null,
      outcome: body.outcome || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /treatments', e)
    return apiError(500, 'Internal server error')
  }
}
