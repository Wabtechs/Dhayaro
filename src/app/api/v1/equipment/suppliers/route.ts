import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentSuppliers } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, enforceFacilityAccess, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentSupplierCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const isActive = searchParams.get('isActive')

    const conditions: any[] = [isNull(equipmentSuppliers.deletedAt)]
    if (search) {
      conditions.push(or(
        ilike(equipmentSuppliers.name, `%${search}%`),
        ilike(equipmentSuppliers.code, `%${search}%`),
        ilike(equipmentSuppliers.contactPerson, `%${search}%`),
      )!)
    }
    if (isActive) conditions.push(eq(equipmentSuppliers.isActive, isActive === 'true'))

    const facilityFilter = addFacilityFilter(equipmentSuppliers.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentSuppliers).where(whereClause),
      getDb().select().from(equipmentSuppliers).where(whereClause).orderBy(desc(equipmentSuppliers.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/suppliers')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplier:manage')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentSupplierCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentSuppliers).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      code: body.code,
      name: body.name,
      contactPerson: body.contactPerson || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      category: body.category || null,
      rating: normalizeNum(body.rating) ?? 3,
      isActive: body.isActive ?? true,
      notes: body.notes || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_supplier', resourceId: row.id, details: { code: row.code, name: row.name } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /equipment/suppliers')
  }
}
