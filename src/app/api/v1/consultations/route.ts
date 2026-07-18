import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { consultations, patients, users } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
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
        ilike(consultations.consultationNumber, `%${search}%`),
        ilike(consultations.motif, `%${search}%`),
        ilike(consultations.notes, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(consultations.patientId, patientId))
    if (doctorId) conditions.push(eq(consultations.doctorId, doctorId))
    if (status) conditions.push(eq(consultations.status, status as 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'))

    const role = auth.user.role.toLowerCase()
    if (['doctor', 'nurse', 'specialist'].includes(role) && auth.user.facilityId) {
      conditions.push(eq(consultations.facilityId, auth.user.facilityId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(consultations).where(whereClause),
      getDb().select({
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
      .where(whereClause)
      .orderBy(desc(consultations.createdAt))
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
    logError('GET /consultations', e)
    const msg = e instanceof Error ? e.message : String(e)
    return apiError(500, msg)
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
    if (!body.motif) {
      return apiError(400, 'motif is required')
    }

    const db = getDb()

    const [patientCheck, doctorCheck] = await Promise.all([
      db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1),
    ])

    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }
    if (doctorCheck.length === 0) {
      return apiError(400, 'Doctor not found')
    }

    const consultationNumber = 'CONS-' + Date.now()
    const facilityId = sanitizeUuid(body.facilityId) || auth.user.facilityId
    const now = new Date()

    const [row] = await db.insert(consultations).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      patientId,
      doctorId,
      consultationNumber,
      motif: body.motif,
      symptoms: body.symptoms || [],
      vitalSigns: body.vitalSigns || {},
      notes: body.notes || null,
      provisionalDiagnosis: body.provisionalDiagnosis || null,
      status: body.status || 'WAITING',
      isFollowUp: body.isFollowUp ?? false,
      previousConsultationId: sanitizeUuid(body.previousConsultationId) || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /consultations', e)
    return apiError(500, 'Internal server error')
  }
}
