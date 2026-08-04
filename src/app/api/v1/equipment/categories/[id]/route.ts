import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentCategories } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, logError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentCategoryUpdateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(equipmentCategories).where(and(eq(equipmentCategories.id, id), isNull(equipmentCategories.deletedAt))).limit(1)
    if (!row) return apiError(404, 'Category not found')
    return NextResponse.json(row)
  } catch (e) {
    logError('GET /equipment/categories/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentCategoryUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['name', 'parentId', 'icon', 'color', 'description', 'isActive', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }

    const [row] = await getDb().update(equipmentCategories).set(fields).where(and(eq(equipmentCategories.id, id), isNull(equipmentCategories.deletedAt))).returning()
    if (!row) return apiError(404, 'Category not found')

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_category', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /equipment/categories/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentCategories).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentCategories.id, id), isNull(equipmentCategories.deletedAt))).returning()
    if (!row) return apiError(404, 'Category not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_category', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /equipment/categories/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
