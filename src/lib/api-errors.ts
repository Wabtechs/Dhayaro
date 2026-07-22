import { NextResponse } from 'next/server'
import { eq, and, SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export function apiError(status: number, detail: string) {
  return NextResponse.json({ detail }, { status })
}

const FACILITY_ROLES = ['DOCTOR', 'SPECIALIST', 'LABORATORY', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST']

export function addFacilityFilter(
  facilityColumn: AnyPgColumn,
  auth: { user: { role: string; facilityId?: string | null } },
  searchParams?: URLSearchParams,
): SQL | undefined {
  if (auth.user.role === 'SUPER_ADMIN') {
    const override = searchParams?.get('facilityId')
    if (override) {
      return eq(facilityColumn, override)
    }
    return undefined
  }
  if (!auth.user.facilityId) {
    return undefined
  }
  return eq(facilityColumn, auth.user.facilityId)
}

export function enforceFacilityAccess(
  body: Record<string, unknown>,
  auth: { user: { role: string; facilityId?: string | null } },
): { facilityId: string | null } {
  if (auth.user.role === 'SUPER_ADMIN') {
    return { facilityId: (body.facilityId as string) || null }
  }
  return { facilityId: auth.user.facilityId || null }
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
