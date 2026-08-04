import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { partnerCompanies } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, partnerCompanyCreateSchema, partnerCompanyUpdateSchema } from '@/lib/api-schemas'

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
        ilike(partnerCompanies.code, `%${search}%`),
        ilike(partnerCompanies.sector, `%${search}%`),
      )!)
    }

    const status = searchParams.get('status')
    if (status) conditions.push(eq(partnerCompanies.contractStatus, status as 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'))

    const facilityFilter = addFacilityFilter(partnerCompanies.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(partnerCompanies).where(whereClause),
      getDb().select({
        id: partnerCompanies.id,
        facilityId: partnerCompanies.facilityId,
        code: partnerCompanies.code,
        name: partnerCompanies.name,
        sector: partnerCompanies.sector,
        address: partnerCompanies.address,
        city: partnerCompanies.city,
        country: partnerCompanies.country,
        phone: partnerCompanies.phone,
        email: partnerCompanies.email,
        website: partnerCompanies.website,
        contactName: partnerCompanies.contactName,
        contactFunction: partnerCompanies.contactFunction,
        contactPhone: partnerCompanies.contactPhone,
        contactEmail: partnerCompanies.contactEmail,
        contractNumber: partnerCompanies.contractNumber,
        contractStartDate: partnerCompanies.contractStartDate,
        contractEndDate: partnerCompanies.contractEndDate,
        contractStatus: partnerCompanies.contractStatus,
        coverageRate: partnerCompanies.coverageRate,
        annualCeiling: partnerCompanies.annualCeiling,
        notes: partnerCompanies.notes,
        isActive: partnerCompanies.isActive,
        createdAt: partnerCompanies.createdAt,
        updatedAt: partnerCompanies.updatedAt,
      })
      .from(partnerCompanies)
      .where(whereClause)
      .orderBy(desc(partnerCompanies.createdAt))
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
    logError('GET /partner-companies', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, partnerCompanyCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()
    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const [row] = await db.insert(partnerCompanies).values({
      facilityId: facilityId || null,
      code: body.code,
      name: body.name,
      sector: body.sector || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || 'RD Congo',
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      contactName: body.contactName || null,
      contactFunction: body.contactFunction || null,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      contractNumber: body.contractNumber || null,
      contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : null,
      contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : null,
      contractStatus: body.contractStatus || 'ACTIVE',
      coverageRate: body.coverageRate ?? null,
      annualCeiling: body.annualCeiling ?? null,
      notes: body.notes || null,
      isActive: true,
createdAt: now,
        updatedAt: now,
      } as any).returning()

    await logAudit(auth.user, 'CREATE', 'partner_company', row.id, { name: row.name, code: row.code })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /partner-companies', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}