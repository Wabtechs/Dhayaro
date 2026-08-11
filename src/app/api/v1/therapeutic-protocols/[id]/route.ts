import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { therapeuticProtocols } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
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
    if (!protocolId) return apiError(400, 'Invalid protocol ID')

    const [row] = await getDb().select().from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!row) return apiError(404, 'Protocol not found')

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
    if (!protocolId) return apiError(400, 'Invalid protocol ID')

    const parsed = await parseJsonBody(request, protocolUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const db = getDb()

    const [existing] = await db.select({ id: therapeuticProtocols.id }).from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!existing) return apiError(404, 'Protocol not found')

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
    if (!protocolId) return apiError(400, 'Invalid protocol ID')

    const db = getDb()
    const [existing] = await db.select({ id: therapeuticProtocols.id }).from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!existing) return apiError(404, 'Protocol not found')

    await db.update(therapeuticProtocols).set({ isActive: false, updatedAt: new Date() }).where(eq(therapeuticProtocols.id, protocolId))
    await logAudit(auth.user, 'DELETE', 'therapeutic_protocol', protocolId, { isActive: false })
    return NextResponse.json({ detail: 'Protocol deactivated' })
  } catch (e) {
return handleEndpointError(e, 'DELETE /therapeutic-protocols/[id]')
  }
}
