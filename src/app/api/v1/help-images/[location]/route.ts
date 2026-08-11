import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { helpImages } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { eq } from 'drizzle-orm'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
) {
  try {
    const auth = await requireRole(_request, ['SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const { location } = await params
    if (!location) return apiErrorResponse('VALIDATION_ERROR', 422, { location: "L'emplacement est requis." })

    const db = getDb()
    await db
      .delete(helpImages)
      .where(eq(helpImages.location, location))

    return NextResponse.json({ deleted: true })
  } catch (e) {
return handleEndpointError(e, 'DELETE /help-images/[location]')
  }
}
