import { NextResponse } from 'next/server'

export function apiError(status: number, detail: string) {
  return NextResponse.json({ detail }, { status })
}

export function logError(endpoint: string, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`${endpoint}:`, msg)
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
  const search = searchParams.get('search') || ''
  const offset = (page - 1) * size
  return { page, size, search, offset }
}

export function pickAllowedKeys(body: Record<string, unknown>, allowedKeys: readonly string[]) {
  const fields: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (key in body && body[key] !== null) {
      fields[key] = body[key]
    }
  }
  fields.updatedAt = new Date()
  return fields
}
