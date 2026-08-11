import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { billingCodes } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { apiError, logError, parsePagination, addFacilityFilter, enforceFacilityAccess } from '@/lib/api-errors'
import { sanitizeSearch } from '@/lib/validation'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, billingCodeCreateSchema, billingCodeUpdateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search: rawSearch, offset } = parsePagination(searchParams)
    const search = sanitizeSearch(rawSearch)

    const conditions = [eq(billingCodes.isActive, true)]

    if (search) {
      conditions.push(or(
        ilike(billingCodes.code, `%${search}%`),
        ilike(billingCodes.label, `%${search}%`),
        ilike(billingCodes.serviceType, `%${search}%`),
      )!)
    }

    const serviceType = searchParams.get('serviceType')
    if (serviceType) {
      conditions.push(eq(billingCodes.serviceType, serviceType))
    }

    const facilityFilter = addFacilityFilter(billingCodes.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = and(...conditions)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(billingCodes).where(whereClause),
      getDb().select().from(billingCodes).where(whereClause).orderBy(desc(billingCodes.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /billing-codes', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, billingCodeCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()

    const [row] = await getDb().insert(billingCodes).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      code: body.code,
      label: body.label,
      serviceType: body.serviceType,
      price: body.price ?? 0,
      currency: body.currency || 'CDF',
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'billing_code', row.id, { code: row.code, label: row.label, price: row.price })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /billing-codes', e)
    return apiError(500, 'Internal server error')
  }
}
