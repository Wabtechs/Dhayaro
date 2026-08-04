import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentSuppliers } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, logError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentSupplierUpdateSchema, normalizeNum } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(equipmentSuppliers).where(and(eq(equipmentSuppliers.id, id), isNull(equipmentSuppliers.deletedAt))).limit(1)
    if (!row) return apiError(404, 'Supplier not found')
    return NextResponse.json(row)
  } catch (e) {
    logError('GET /equipment/suppliers/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplier:manage')
    if ('error' in auth) return auth.error

    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentSupplierUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const stringKeys = ['code', 'name', 'contactPerson', 'phone', 'email', 'address', 'city', 'category', 'notes', 'facilityId'] as const
    for (const k of stringKeys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.rating !== undefined && body.rating !== null && body.rating !== '') fields.rating = normalizeNum(body.rating)
    if (body.isActive !== undefined && body.isActive !== null) fields.isActive = body.isActive

    const [row] = await getDb().update(equipmentSuppliers).set(fields).where(and(eq(equipmentSuppliers.id, id), isNull(equipmentSuppliers.deletedAt))).returning()
    if (!row) return apiError(404, 'Supplier not found')

    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_supplier', resourceId: row.id, details: { code: row.code, name: row.name } })
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /equipment/suppliers/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'supplier:manage')
    if ('error' in auth) return auth.error

    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentSuppliers).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentSuppliers.id, id), isNull(equipmentSuppliers.deletedAt))).returning()
    if (!row) return apiError(404, 'Supplier not found')

    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_supplier', resourceId: row.id, details: { code: row.code, name: row.name } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /equipment/suppliers/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
