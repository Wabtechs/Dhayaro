import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { labCategories } from '@/lib/schema'
import { eq, desc, count } from 'drizzle-orm'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(labCategories).where(eq(labCategories.isActive, true)),
      getDb().select().from(labCategories)
        .where(eq(labCategories.isActive, true))
        .orderBy(desc(labCategories.name))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /lab/categories', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'LABORATORY'])
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.name) {
      return apiError(400, 'name is required')
    }

    const now = new Date()

    const [row] = await getDb().insert(labCategories).values({
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || null,
      isActive: true,
      createdAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /lab/categories', e)
    return apiError(500, 'Internal server error')
  }
}
