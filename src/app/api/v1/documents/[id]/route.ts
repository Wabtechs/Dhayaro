import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

const DOC_KEYS = ['patientId', 'consultationId', 'documentType', 'title', 'content', 'filePath', 'isPrinted'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1)

    if (!row) {
      return apiError(404, 'Document not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    const existing = await getDb().select({ id: documents.id }).from(documents).where(eq(documents.id, id)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Document not found')
    }

    const allowedFields = pickAllowedKeys(body, DOC_KEYS)

    if (body.patientId) {
      allowedFields.patientId = body.patientId
    }
    if (body.consultationId) {
      allowedFields.consultationId = body.consultationId
    }

    const [updated] = await getDb()
      .update(documents)
      .set(allowedFields)
      .where(eq(documents.id, id))
      .returning()

    await logAudit(auth.user, 'UPDATE', 'document', id, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params

    const existing = await getDb().select({ id: documents.id }).from(documents).where(eq(documents.id, id)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Document not found')
    }

    await getDb().delete(documents).where(eq(documents.id, id))

    await logAudit(auth.user, 'DELETE', 'document', id)

    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /documents/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
