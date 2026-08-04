import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { partnerCompanies } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, partnerCompanyUpdateSchema } from '@/lib/api-schemas'

const ALLOWED_UPDATE_KEYS = ['name', 'sector', 'address', 'city', 'country', 'phone', 'email', 'website', 'contactName', 'contactFunction', 'contactPhone', 'contactEmail', 'contractNumber', 'contractStartDate', 'contractEndDate', 'contractStatus', 'coverageRate', 'annualCeiling', 'notes', 'isActive'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const companyId = sanitizeUuid(id)
    if (!companyId) return apiError(400, 'Invalid company ID')

    const db = getDb()

    const conditions = [eq(partnerCompanies.id, companyId)]
    const facilityFilter = addFacilityFilter(partnerCompanies.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [company] = await db.select().from(partnerCompanies).where(and(...conditions)).limit(1)

    if (!company) return apiError(404, 'Partner company not found')

    return NextResponse.json(company)
  } catch (e) {
    logError('GET /partner-companies/[id]', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const companyId = sanitizeUuid(id)
    if (!companyId) return apiError(400, 'Invalid company ID')

    const parsed = await parseJsonBody(request, partnerCompanyUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()

    const conditions = [eq(partnerCompanies.id, companyId)]
    const facilityFilter = addFacilityFilter(partnerCompanies.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select().from(partnerCompanies).where(and(...conditions)).limit(1)
    if (!existing) return apiError(404, 'Partner company not found')

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)

    const [row] = await db.update(partnerCompanies).set({ ...fields, updatedAt: new Date() }).where(eq(partnerCompanies.id, companyId)).returning()
    await logAudit(auth.user, 'UPDATE', 'partner_company', companyId, { name: row.name })

    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /partner-companies/[id]', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const companyId = sanitizeUuid(id)
    if (!companyId) return apiError(400, 'Invalid company ID')

    const db = getDb()

    const conditions = [eq(partnerCompanies.id, companyId)]
    const facilityFilter = addFacilityFilter(partnerCompanies.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select().from(partnerCompanies).where(and(...conditions)).limit(1)
    if (!existing) return apiError(404, 'Partner company not found')

    await db.update(partnerCompanies).set({ isActive: false, updatedAt: new Date() }).where(eq(partnerCompanies.id, companyId))
    await logAudit(auth.user, 'DELETE', 'partner_company', companyId, { name: existing.name })

    return NextResponse.json({ detail: 'Partner company deactivated' })
  } catch (e) {
    logError('DELETE /partner-companies/[id]', e)
    return apiError(500, 'Internal server error')
  }
}