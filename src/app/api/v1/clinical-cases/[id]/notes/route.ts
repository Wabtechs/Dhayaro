import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { caseNotes, clinicalCases, users } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { sanitizeUuid } from '@/lib/validation'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, caseNoteCreateSchema } from '@/lib/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { caseId: "L'identifiant du dossier est invalide." })

    const db = getDb()

    const [caseCheck] = await db
      .select({ id: clinicalCases.id })
      .from(clinicalCases)
      .where(eq(clinicalCases.id, validId))
      .limit(1)
    if (!caseCheck) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const items = await db
      .select({
        id: caseNotes.id,
        caseId: caseNotes.caseId,
        authorId: caseNotes.authorId,
        content: caseNotes.content,
        createdAt: caseNotes.createdAt,
        authorFirstname: users.firstname,
        authorLastname: users.lastname,
      })
      .from(caseNotes)
      .leftJoin(users, eq(caseNotes.authorId, users.id))
      .where(eq(caseNotes.caseId, validId))
      .orderBy(desc(caseNotes.createdAt))

    return NextResponse.json({ items, total: items.length })
  } catch (e) {
return handleEndpointError(e, 'GET /clinical-cases/[id]/notes')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { caseId: "L'identifiant du dossier est invalide." })

    const parsed = await parseJsonBody(request, caseNoteCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const db = getDb()

    const [caseCheck] = await db
      .select({ id: clinicalCases.id })
      .from(clinicalCases)
      .where(eq(clinicalCases.id, validId))
      .limit(1)
    if (!caseCheck) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const [row] = await db
      .insert(caseNotes)
      .values({
        caseId: validId,
        authorId: auth.user.sub,
        content: body.content,
      })
      .returning()

    await logAudit(auth.user, 'CREATE', 'case_note', row.id, { caseId: validId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
return handleEndpointError(e, 'POST /clinical-cases/[id]/notes')
  }
}
