import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentDocuments, medicalEquipment } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, logError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentDocumentUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select(SELECT)
      .from(equipmentDocuments)
      .leftJoin(medicalEquipment, eq(equipmentDocuments.equipmentId, medicalEquipment.id))
      .where(and(eq(equipmentDocuments.id, id), isNull(equipmentDocuments.deletedAt)))
      .limit(1)
    if (!row) return apiError(404, 'Document not found')
    return NextResponse.json(row)
  } catch (e) {
    logError('GET /equipment/documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentDocumentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['equipmentId', 'title', 'category', 'filePath', 'fileType', 'description', 'facilityId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.fileSize !== undefined && body.fileSize !== null && body.fileSize !== '') fields.fileSize = normalizeNum(body.fileSize)

    const [row] = await getDb().update(equipmentDocuments).set(fields).where(and(eq(equipmentDocuments.id, id), isNull(equipmentDocuments.deletedAt))).returning()
    if (!row) return apiError(404, 'Document not found')

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_document', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title, category: row.category } })
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /equipment/documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentDocuments).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentDocuments.id, id), isNull(equipmentDocuments.deletedAt))).returning()
    if (!row) return apiError(404, 'Document not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_document', resourceId: row.id, details: { equipmentId: row.equipmentId, title: row.title } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /equipment/documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
