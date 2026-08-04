import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careCoverages, patients } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, careCoverageCreateSchema, careCoverageUpdateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(careCoverages.organization, `%${search}%`),
        ilike(careCoverages.contractNumber, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const coverageType = searchParams.get('coverageType')
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(careCoverages.patientId, patientId))
    if (coverageType) conditions.push(eq(careCoverages.coverageType, coverageType as string))
    if (status) conditions.push(eq(careCoverages.status, status as string))

    const facilityFilter = addFacilityFilter(careCoverages.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(careCoverages).where(whereClause),
      getDb().select({
        id: careCoverages.id,
        facilityId: careCoverages.facilityId,
        patientId: careCoverages.patientId,
        coverageType: careCoverages.coverageType,
        organization: careCoverages.organization,
        contractNumber: careCoverages.contractNumber,
        coverageRate: careCoverages.coverageRate,
        coverageCeiling: careCoverages.coverageCeiling,
        remainingAmount: careCoverages.remainingAmount,
        validFrom: careCoverages.validFrom,
        validUntil: careCoverages.validUntil,
        status: careCoverages.status,
        justification: careCoverages.justification,
        isActive: careCoverages.isActive,
        createdAt: careCoverages.createdAt,
        updatedAt: careCoverages.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
      })
      .from(careCoverages)
      .leftJoin(patients, eq(careCoverages.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(careCoverages.createdAt))
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
    logError('GET /care-coverages', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, careCoverageCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)
    if (!patientId) return apiError(400, 'Patient ID is required')

    const db = getDb()

    const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }

    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const [row] = await db.insert(careCoverages).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      patientId,
      coverageType: body.coverageType,
      organization: body.organization || null,
      contractNumber: body.contractNumber || null,
      coverageRate: body.coverageRate ?? null,
      coverageCeiling: body.coverageCeiling ?? null,
      remainingAmount: body.remainingAmount ?? null,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      status: body.status || 'ACTIVE',
      justification: body.justification || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'care_coverage', row.id, { patientId: row.patientId, coverageType: row.coverageType })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /care-coverages', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}