import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rows = await getDb().select().from(clinicalCases).where(eq(clinicalCases.id, id)).limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ detail: 'Clinical case not found' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const [updated] = await getDb()
      .update(clinicalCases)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(clinicalCases.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ detail: 'Clinical case not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
