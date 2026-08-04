import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentDocuments, medicalEquipment } from '@/lib/schema'
import { eq, and, desc, isNull, ilike, or, count } from 'drizzle-orm'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentDocumentCreateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

const SELECT = {
  id: equipmentDocuments.id,
  facilityId: equipmentDocuments.facilityId,
  equipmentId: equipmentDocuments.equipmentId,
  title: equipmentDocuments.title,
  category: equipmentDocuments.category,
  filePath: equipmentDocuments.filePath,
  fileType: equipmentDocuments.fileType,
  fileSize: equipmentDocuments.fileSize,
  version: equipmentDocuments.version,
  description: equipmentDocuments.description,
  createdAt: equipmentDocuments.createdAt,
  updatedAt: equipmentDocuments.updatedAt,
  equipmentName: medicalEquipment.name,
  equipmentCode: medicalEquipment.code,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)
    const equipmentId = searchParams.get('equipmentId')

    const conditions: any[] = [isNull(equipmentDocuments.deletedAt)]

    if (equipmentId) conditions.push(eq(equipmentDocuments.equipmentId, equipmentId))
    if (search) {
      conditions.push(or(
        ilike(equipmentDocuments.title, `%${search}%`),
        ilike(equipmentDocuments.description, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(equipmentDocuments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(equipmentDocuments).where(whereClause),
      getDb().select(SELECT)
        .from(equipmentDocuments)
        .leftJoin(medicalEquipment, eq(equipmentDocuments.equipmentId, medicalEquipment.id))
        .where(whereClause)
        .orderBy(desc(equipmentDocuments.createdAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({ items, total: countResult?.value ?? 0, page, size })
  } catch (e) {
    logError('GET /equipment/documents', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, equipmentDocumentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const [row] = await getDb().insert(equipmentDocuments).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      equipmentId: body.equipmentId,
      title: body.title,
      category: body.category || 'OTHER',
      filePath: body.filePath || null,
      fileType: body.fileType || null,
      fileSize: normalizeNum(body.fileSize),
      version: 1,
      description: body.description || null,
      createdBy: auth.user.sub,
      updatedBy: auth.user.sub,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logEquipmentAudit({ user: auth.user, action: 'CREATE', resource: 'equipment_document', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title, category: row.category } })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /equipment/documents', e)
    return apiError(500, 'Internal server error')
  }
}
