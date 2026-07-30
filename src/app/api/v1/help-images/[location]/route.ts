import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { helpImages } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { apiError, logError } from '@/lib/api-errors'
import { eq } from 'drizzle-orm'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
) {
  try {
    const auth = await requireRole(_request, ['SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const { location } = await params
    if (!location) return apiError(400, 'location is required')

    const db = getDb()
    await db
      .delete(helpImages)
      .where(eq(helpImages.location, location))

    return NextResponse.json({ deleted: true })
  } catch (e) {
    logError('DELETE /help-images/[location]', e)
    return apiError(500, 'Internal server error')
  }
}
