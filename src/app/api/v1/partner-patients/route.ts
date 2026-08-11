import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { partnerPatients, partnerCompanies, patients } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, handleEndpointError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, partnerPatientCreateSchema, partnerPatientUpdateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(partnerCompanies.name, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
        ilike(partnerPatients.contractNumber, `%${search}%`),
      )!)
    }

    const partnerId = sanitizeUuid(searchParams.get('partnerId'))
    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const status = searchParams.get('status')

    if (partnerId) conditions.push(eq(partnerPatients.partnerId, partnerId))
    if (patientId) conditions.push(eq(partnerPatients.patientId, patientId))
    if (status) conditions.push(eq(partnerPatients.status, status as 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'))

    const facilityFilter = addFacilityFilter(partnerPatients.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(partnerPatients).where(whereClause),
      getDb().select({
        id: partnerPatients.id,
        facilityId: partnerPatients.facilityId,
        partnerId: partnerPatients.partnerId,
        patientId: partnerPatients.patientId,
        contractNumber: partnerPatients.contractNumber,
        coverageRate: partnerPatients.coverageRate,
        annualCeiling: partnerPatients.annualCeiling,
        remainingAmount: partnerPatients.remainingAmount,
        validFrom: partnerPatients.validFrom,
        validUntil: partnerPatients.validUntil,
        status: partnerPatients.status,
        notes: partnerPatients.notes,
        isActive: partnerPatients.isActive,
        createdAt: partnerPatients.createdAt,
        updatedAt: partnerPatients.updatedAt,
        partnerName: partnerCompanies.name,
        partnerCode: partnerCompanies.code,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
      })
      .from(partnerPatients)
      .leftJoin(partnerCompanies, eq(partnerPatients.partnerId, partnerCompanies.id))
      .leftJoin(patients, eq(partnerPatients.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(partnerPatients.createdAt))
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
return handleEndpointError(e, 'GET /partner-patients')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, partnerPatientCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const partnerCheck = await db.select({ id: partnerCompanies.id }).from(partnerCompanies).where(eq(partnerCompanies.id, body.partnerId)).limit(1)
    if (partnerCheck.length === 0) {
      return apiError(400, 'Partner company not found')
    }

    const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, body.patientId)).limit(1)
    if (patientCheck.length === 0) {
      return apiError(400, 'Patient not found')
    }

    const [row] = await db.insert(partnerPatients).values({
      facilityId: facilityId || null,
      partnerId: body.partnerId,
      patientId: body.patientId,
      contractNumber: body.contractNumber || null,
      coverageRate: body.coverageRate ?? null,
      annualCeiling: body.annualCeiling ?? null,
      remainingAmount: body.remainingAmount ?? null,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      status: body.status || 'ACTIVE',
      notes: body.notes || null,
      isActive: true,
createdAt: now,
        updatedAt: now,
      } as any).returning()

    await logAudit(auth.user, 'CREATE', 'partner_patient', row.id, { partnerId: row.partnerId, patientId: row.patientId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    return handleEndpointError(e, 'POST /partner-patients')
  }
}