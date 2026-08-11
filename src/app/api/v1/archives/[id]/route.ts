import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { archives, patients, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiErrorResponse, pickAllowedKeys, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { parseJsonBody, archiveUpdateSchema } from '@/lib/api-schemas'

const ARCHIVE_KEYS = ['title', 'summary', 'data'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { archiveId: "L'identifiant de l'archive est invalide." })

    const [row] = await getDb()
      .select({
        id: archives.id,
        facilityId: archives.facilityId,
        entityType: archives.entityType,
        entityId: archives.entityId,
        patientId: archives.patientId,
        title: archives.title,
        summary: archives.summary,
        archivedBy: archives.archivedBy,
        data: archives.data,
        createdAt: archives.createdAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        archivistFirstname: users.firstname,
        archivistLastname: users.lastname,
      })
      .from(archives)
      .leftJoin(patients, eq(archives.patientId, patients.id))
      .leftJoin(users, eq(archives.archivedBy, users.id))
      .where(eq(archives.id, validId))
      .limit(1)

    if (!row) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    return NextResponse.json(row)
  } catch (e) {
return handleEndpointError(e, 'GET /archives/[id]')
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { archiveId: "L'identifiant de l'archive est invalide." })

    const parsed = await parseJsonBody(request, archiveUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const existing = await getDb().select({ id: archives.id }).from(archives).where(eq(archives.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    const allowedFields = pickAllowedKeys(body, ARCHIVE_KEYS)

    const [updated] = await getDb()
      .update(archives)
      .set(allowedFields)
      .where(eq(archives.id, validId))
      .returning()

    await logAudit(auth.user, 'UPDATE', 'archive', validId, { ...allowedFields })

    return NextResponse.json(updated)
  } catch (e) {
return handleEndpointError(e, 'PUT /archives/[id]')
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
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { archiveId: "L'identifiant de l'archive est invalide." })

    const existing = await getDb().select({ id: archives.id }).from(archives).where(eq(archives.id, validId)).limit(1)
    if (existing.length === 0) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    await getDb().delete(archives).where(eq(archives.id, validId))

    await logAudit(auth.user, 'DELETE', 'archive', validId)

    return NextResponse.json({ success: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /archives/[id]')
  }
}
