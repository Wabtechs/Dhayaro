import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentLocations } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentLocationCreateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    if (all) {
      const conditions: any[] = [isNull(equipmentLocations.deletedAt)]
      const facilityFilter = addFacilityFilter(equipmentLocations.facilityId, auth, searchParams)
      if (facilityFilter) conditions.push(facilityFilter)
      const items = await getDb().select().from(equipmentLocations).where(and(...conditions)).orderBy(equipmentLocations.name)
      return NextResponse.json({ items, total: items.length, page: 1, size: items.length })
    }

    const { page, size, search, offset } = parsePagination(searchParams)
    const type = searchParams.get('type')
    const conditions: any[] = [isNull(equipmentLocations.deletedAt)]

    if (search) {
      conditions.push(or(
        ilike(equipmentLocations.name, `%${search}%`),
        ilike(equipmentLocations.code, `%${search}%`),
        ilike(equipmentLocations.department, `%${search}%`),
        ilike(equipmentLocations.room, `%${search}%`),
      )!)
    }
    if (type) conditions.push(eq(equipmentLocations.type, type as never))

    const facilityFilter = addFacilityFilter(equipmentLocations.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentLocations).where(whereClause),
      getDb().select().from(equipmentLocations).where(whereClause).orderBy(desc(equipmentLocations.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/locations', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:create')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentLocationCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentLocations).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      parentId: body.parentId || null,
      type: body.type || 'DEPARTMENT',
      name: body.name,
      building: body.building || null,
      floor: body.floor || null,
      department: body.department || null,
      room: body.room || null,
      position: body.position || null,
      code: body.code || null,
      description: body.description || null,
      isActive: body.isActive ?? true,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_location', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/locations', e)
    return apiError(500, 'Internal server error')
  }
}
