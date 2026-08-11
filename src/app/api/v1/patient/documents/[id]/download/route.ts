import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, documents, users, facilities } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { sanitizeUuid } from '@/lib/validation'
import { generateDocumentPdf } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') return apiErrorResponse('ACCESS_DENIED', 403)

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { documentId: "L'identifiant du document est invalide." })

    const [patient] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, auth.user.sub)).limit(1)
    if (!patient) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const [document] = await getDb()
      .select({
        id: documents.id,
        title: documents.title,
        documentType: documents.documentType,
        content: documents.content,
        createdAt: documents.createdAt,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
        facilityName: facilities.name,
      })
      .from(documents)
      .leftJoin(users, eq(documents.doctorId, users.id))
      .leftJoin(facilities, eq(documents.facilityId, facilities.id))
      .where(and(
        eq(documents.id, validId),
        eq(documents.patientId, patient.id),
        eq(documents.isActive, true),
      ))
      .limit(1)

    if (!document) return apiErrorResponse('RESOURCE_NOT_FOUND', 404)

    const doctorName = document.doctorFirstname && document.doctorLastname
      ? `${document.doctorFirstname} ${document.doctorLastname}`
      : undefined

    const pdf = generateDocumentPdf({
      title: document.title,
      documentType: document.documentType,
      content: document.content || {},
      facilityName: document.facilityName,
      doctorName,
      createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : String(document.createdAt ?? ''),
    })

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.id.slice(0, 8)}-${document.documentType.toLowerCase()}.pdf"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e) {
    return handleEndpointError(e, 'GET /patient/documents/[id]/download')
  }
}
