import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rows = await getDb().select().from(patients).where(eq(patients.id, id)).limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ detail: 'Patient not found' }, { status: 404 })
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
      .update(patients)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ detail: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
