import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { therapeuticProtocols } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

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
    logError('GET /therapeutic-protocols/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const protocolId = sanitizeUuid(id)
    if (!protocolId) return apiError(400, 'Invalid protocol ID')

    const body = await request.json()
    const db = getDb()

    const [existing] = await db.select({ id: therapeuticProtocols.id }).from(therapeuticProtocols).where(eq(therapeuticProtocols.id, protocolId)).limit(1)
    if (!existing) return apiError(404, 'Protocol not found')

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)
    if (body.diseaseId) fields.diseaseId = sanitizeUuid(body.diseaseId) || null

    const [row] = await db.update(therapeuticProtocols).set(fields).where(eq(therapeuticProtocols.id, protocolId)).returning()
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /therapeutic-protocols/[id]', e)
    return apiError(500, 'Internal server error')
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
    return NextResponse.json({ detail: 'Protocol deactivated' })
  } catch (e) {
    logError('DELETE /therapeutic-protocols/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
