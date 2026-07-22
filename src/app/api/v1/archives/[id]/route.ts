import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { archives, patients } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const ARCHIVE_KEYS = ['title', 'summary', 'data'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
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
      })
      .from(archives)
      .leftJoin(patients, eq(archives.patientId, patients.id))
      .where(eq(archives.id, id))
      .limit(1)

    if (!row) {
      return apiError(404, 'Archive not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /archives/[id]', e)
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

    const existing = await getDb().select({ id: archives.id }).from(archives).where(eq(archives.id, id)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Archive not found')
    }

    const allowedFields = pickAllowedKeys(body, ARCHIVE_KEYS)

    const [updated] = await getDb()
      .update(archives)
      .set(allowedFields)
      .where(eq(archives.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /archives/[id]', e)
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

    const existing = await getDb().select({ id: archives.id }).from(archives).where(eq(archives.id, id)).limit(1)
    if (existing.length === 0) {
      return apiError(404, 'Archive not found')
    }

    await getDb().delete(archives).where(eq(archives.id, id))

    return NextResponse.json({ success: true })
  } catch (e) {
    logError('DELETE /archives/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
