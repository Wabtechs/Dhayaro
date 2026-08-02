import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { helpImages } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { apiError, logError } from '@/lib/api-errors'
import { parseJsonBody, helpImageSchema } from '@/lib/api-schemas'
import { eq, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locations = searchParams.get('locations')

    const db = getDb()
    if (locations) {
      const locs = locations.split(',').map(l => l.trim()).filter(Boolean)
      const rows = await db
        .select()
        .from(helpImages)
        .where(inArray(helpImages.location, locs))
      return NextResponse.json(rows)
    }

    const rows = await db.select().from(helpImages)
    return NextResponse.json(rows)
  } catch (e) {
    logError('GET /help-images', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, helpImageSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const { location, imageData, altText } = body

    const db = getDb()
    const existing = await db
      .select({ id: helpImages.id })
      .from(helpImages)
      .where(eq(helpImages.location, location))
      .limit(1)

    if (existing.length > 0) {
      const [row] = await db
        .update(helpImages)
        .set({
          imageData,
          altText: altText || null,
          updatedAt: new Date(),
          updatedBy: auth.user.sub,
        })
        .where(eq(helpImages.location, location))
        .returning()
      return NextResponse.json(row)
    }

    const [row] = await db
      .insert(helpImages)
      .values({
        location,
        imageData,
        altText: altText || null,
        updatedBy: auth.user.sub,
      })
      .returning()
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /help-images', e)
    return apiError(500, 'Internal server error')
  }
}
