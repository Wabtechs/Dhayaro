import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { stockMovements, medicalSupplies } from '@/lib/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { sanitizeUuid } from '@/lib/validation'
import { requireEquipmentPermission, logEquipmentAudit } from '@/lib/equipment-utils'
import { parseJsonBody } from '@/lib/api-schemas'
import { stockMovementUpdateSchema } from '@/lib/api-schemas-equipment'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:view')
    if ('error' in auth) return auth.error
    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { movementId: "L'identifiant du mouvement est invalide." })
    const [row] = await getDb()
      .select({
        id: stockMovements.id,
        facilityId: stockMovements.facilityId,
        supplyId: stockMovements.supplyId,
        batchId: stockMovements.batchId,
        movementType: stockMovements.movementType,
        quantity: stockMovements.quantity,
        unitCost: stockMovements.unitCost,
        fromLocation: stockMovements.fromLocation,
        toLocation: stockMovements.toLocation,
        reason: stockMovements.reason,
        referenceId: stockMovements.referenceId,
        createdAt: stockMovements.createdAt,
        supplyName: medicalSupplies.name,
      })
      .from(stockMovements)
      .leftJoin(medicalSupplies, eq(stockMovements.supplyId, medicalSupplies.id))
      .where(and(eq(stockMovements.id, id), isNull(stockMovements.deletedAt)))
      .limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /supplies/movements/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { movementId: "L'identifiant du mouvement est invalide." })
    const parsed = await parseJsonBody(request, stockMovementUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const now = new Date()
    const fields: Record<string, unknown> = { updatedBy: auth.user.sub, updatedAt: now }
    const keys = ['supplyId', 'batchId', 'movementType', 'unitCost', 'fromLocation', 'toLocation', 'reason', 'referenceId', 'facilityId'] as const
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') fields[k] = body[k]
    }
    if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') fields.quantity = body.quantity

    const [row] = await getDb().update(stockMovements).set(fields).where(and(eq(stockMovements.id, id), isNull(stockMovements.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    await logEquipmentAudit({ user: auth.user, action: 'UPDATE', resource: 'stock_movement', resourceId: row.id, details: { supplyId: row.supplyId, quantity: row.quantity } })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /supplies/movements/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireEquipmentPermission(request, 'stock:manage')
    if ('error' in auth) return auth.error
    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { movementId: "L'identifiant du mouvement est invalide." })
    const now = new Date()
    const [row] = await getDb().update(stockMovements).set({ deletedAt: now, updatedBy: auth.user.sub, updatedAt: now }).where(and(eq(stockMovements.id, id), isNull(stockMovements.deletedAt))).returning()
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    await logEquipmentAudit({ user: auth.user, action: 'DELETE', resource: 'stock_movement', resourceId: row.id, details: { supplyId: row.supplyId } })
    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /supplies/movements/[id]')
  }
}
