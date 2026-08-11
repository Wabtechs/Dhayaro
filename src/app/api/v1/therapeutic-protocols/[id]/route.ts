import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { therapeuticProtocols } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiErrorResponse, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { parseJsonBody, protocolUpdateSchema } from '@/lib/api-schemas'

const ALLOWED_UPDATE_KEYS = ['name', 'description', 'steps', 'targetPopulation', 'contraindications', 'efficacyRate', 'isActive', 'diseaseId'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const protocolId = sanitizeUuid(id)
    if (!protocolId) return apiErrorResponse('VALIDATION_ERROR', 422, { protocolId: "L'identifiant du protocole est invalide." })

    const [row] = await getDb().select().from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!row) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /therapeutic-protocols/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const protocolId = sanitizeUuid(id)
    if (!protocolId) return apiErrorResponse('VALIDATION_ERROR', 422, { protocolId: "L'identifiant du protocole est invalide." })

    const parsed = await parseJsonBody(request, protocolUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const db = getDb()

    const [existing] = await db.select({ id: therapeuticProtocols.id }).from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)
    if (body.diseaseId) fields.diseaseId = sanitizeUuid(body.diseaseId) || null

    const [row] = await db.update(therapeuticProtocols).set(fields).where(eq(therapeuticProtocols.id, protocolId)).returning()
    await logAudit(auth.user, 'UPDATE', 'therapeutic_protocol', protocolId, { name: row.name })
    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'PUT /therapeutic-protocols/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const protocolId = sanitizeUuid(id)
    if (!protocolId) return apiErrorResponse('VALIDATION_ERROR', 422, { protocolId: "L'identifiant du protocole est invalide." })

    const db = getDb()
    const [existing] = await db.select({ id: therapeuticProtocols.id }).from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!existing) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    await db.update(therapeuticProtocols).set({ isActive: false, updatedAt: new Date() }).where(eq(therapeuticProtocols.id, protocolId))
    await logAudit(auth.user, 'DELETE', 'therapeutic_protocol', protocolId, { isActive: false })
    return NextResponse.json({ success: true, data: { id: protocolId }, message: 'Protocole désactivé avec succès.' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /therapeutic-protocols/[id]')
  }
}
