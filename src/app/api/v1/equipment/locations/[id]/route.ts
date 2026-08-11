import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { equipmentLocations } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { equipmentLocationUpdateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:view')
    if ('error' in auth) return auth.error
    const { id } = await params
    const [row] = await getDb().select().from(equipmentLocations).where(and(eq(equipmentLocations.id, id), isNull(equipmentLocations.deletedAt))).limit(1)
    if (!row) return apiError(404, 'Location not found')
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /equipment/locations/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:update')
    if ('error' in auth) return auth.error
    const { id } = await params
    const parsed = await parseJsonBody(request, equipmentLocationUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['parentId', 'type', 'name', 'building', 'floor', 'department', 'room', 'position', 'code', 'description', 'isActive', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }

    const [row] = await getDb().update(equipmentLocations).set(fields).where(and(eq(equipmentLocations.id, id), isNull(equipmentLocations.deletedAt))).returning()
    if (!row) return apiError(404, 'Location not found')
    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'equipment_location', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /equipment/locations/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'equipment:delete')
    if ('error' in auth) return auth.error
    const { id } = await params
    const now = new Date()
    const [row] = await getDb().update(equipmentLocations).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(equipmentLocations.id, id), isNull(equipmentLocations.deletedAt))).returning()
    if (!row) return apiError(404, 'Location not found')
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'equipment_location', resourceId: row.id, details: { name: row.name } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /equipment/locations/[id]')
  }
}
