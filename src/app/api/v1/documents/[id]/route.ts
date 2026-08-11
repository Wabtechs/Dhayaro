import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody, documentUpdateSchema } from '@/lib/api-schemas'

const DOC_KEYS = ['patientId', 'consultationId', 'documentType', 'title', 'content', 'filePath', 'isPrinted'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb().select().from(documents).where(eq(documents.id, validId)).limit(1)

    if (!row) {
      return apiError(404, 'Document not found')
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /documents/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const parsed = await parseJsonBody(request, documentUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: documents.id }).from(documents).where(eq(documents.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Document not found')
    }

    const allowedFields = pickAllowedKeys(body, DOC_KEYS)

    if (body.patientId && sanitizeUuid(body.patientId)) {
      allowedFields.patientId = body.patientId
    }
    if (body.consultationId && sanitizeUuid(body.consultationId)) {
      allowedFields.consultationId = body.consultationId
    }

    const [updated] = await getDb()
      .update(documents)
      .set(allowedFields)
      .where(eq(documents.id, validId))
      .returning()

    await logAudit(auth.user, 'UPDATE', 'document', validId, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /documents/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const existing = await getDb().select({ id: documents.id }).from(documents).where(eq(documents.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Document not found')
    }

    await getDb().update(documents).set({ isActive: false }).where(eq(documents.id, validId))

    await logAudit(auth.user, 'DELETE', 'document', validId)

    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /documents/[id]')
  }
}
